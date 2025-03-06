import { neo4j } from "@hypermode/modus-sdk-as"
import { models } from "@hypermode/modus-sdk-as"
import { EmbeddingsModel } from "@hypermode/modus-sdk-as/models/experimental/embeddings"
import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat"
import { JSON } from "json-as"

const hostName = "neo4j"

@json
class EntityTextPair {
  entity_name!: string
  relevant_text!: string
}
@json
class ClauseExplanation {
  meaning!: string
  counters!: string[]
}

@json
class ContractExplanation {
  clause!: string
  explanation!: ClauseExplanation
}

const INITIAL_ENTITY_PROMPT = `
You are a legal document analyzer. Given a section of contract text, identify the legal concepts/entities and their associated text.

Extract broader, more generic legal entities (like "Employment", "Compensation", "Benefits") and associate the relevant text with each.
 Use top-level categories rather than highly specific sub-categories.

Format your response as a JSON array of objects with fields:
- entity_name: The name of the legal concept (use broad, generic naming)
- relevant_text: The specific text from the chunk that belongs to this entity

Example response:
[
  {
    "entity_name": "Benefits",
    "relevant_text": "Employee shall be entitled to 20 days of paid vacation annually"
  },
  {
    "entity_name": "Compensation",
    "relevant_text": "Base compensation shall be $60,000 per annum, paid bi-weekly"
  }
]

Important:
- Use broad, generic entity names (e.g., "Termination" instead of "Termination by Employee")
- Consolidate related concepts under a single entity name (e.g., all termination-related clauses go under "Termination")
- The relevant_text should be exactly as it appears in the contract - no paraphrasing or summarizing
- Group similar concepts together rather than creating new entities for slight variations
- Aim to create the minimum number of entities needed to categorize the document effectively
`

const SUBSEQUENT_CHUNK_PROMPT = `
You are a legal document analyzer. Given a section of contract text and existing entities, identify how this text relates to 
existing entities or if it requires new ones.

Existing entities: {{ENTITIES}}

Format your response as a JSON array of objects with fields:
- entity_name: Preferably an existing entity name, or a new broad category if absolutely necessary
- relevant_text: The specific text that belongs to this entity

Example response:
[
  {
    "entity_name": "Benefits",
    "relevant_text": "Unused vacation days will be carried forward to the next year"
  }
]

Important:
- Always prioritize using existing entity names, even if the match is not perfect
- Only create new entities when the concept is fundamentally distinct from all existing entities
- Use broad, generic categories rather than specific sub-categories
- The relevant_text should be exactly as it appears in the contract - no paraphrasing or summarizing
- Aim to maintain the minimum number of entities necessary, at maximum 20.
- For clauses that could fit in multiple categories, choose the most relevant general category
- Example of broad categories to use: "Employment", "Compensation", "Benefits", "Termination", "Confidentiality", "Intellectual Property",
 "Governing Law", etc.
`

const EXPLANATION_PROMPT = 
`You are a legal contract expert. Given a contract clause title and its associated text, explain it in simple terms and suggest potential negotiation counters.

Contract Clause: {{ENTITY_NAME}}
Contract Text: {{TEXT}}

Format your response as a JSON object with fields:
- meaning: A clear, thorough explanation in simple terms that doesn't miss any details
- counters: Potential negotiation points or counter-proposals (if applicable, otherwise empty array)

Example response:
{
  "meaning": "This clause states that you get 20 days of paid vacation each year. The vacation days must be approved by your manager at least 2 weeks in advance. Unused days don't carry over to the next year.",
  "counters": [
    "Request for vacation days to carry over to next year",
    "Negotiate for shorter advance notice period for vacation requests",
    "Ask for more vacation days if industry standard is higher"
  ]
}

Important:
- Explain every detail mentioned in the contract text. make it simple and concise without missing anything.
- Focus on the implications of the clause for the user, explaining what it means for them in practice.
- Keep explanations concise while covering all important details.
- Use simple, clear language while maintaining accuracy
- Be thorough - don't skip any points from the original text
- Suggest realistic and relevant negotiation counters (not some generic ones but specific). most important three.
- If no reasonable negotiation counters exist, return an empty array
- keep it concise.
`


const RAG_PROMPT = `
You are a legal contract expert. Based on the provided contract text segments, answer the user's question accurately and comprehensively.

Only use information from the provided contract text segments. 

Contract Text Segments:
{{CONTEXT}}

User Question: {{QUESTION}}

Important:
- Base your answer only on the provided contract text segments
- Be specific and precise
- If the provided text doesn't fully answer the question, acknowledge this
- if it's a general question, provide a general answer based on your knowledge.
`


/**
 * Break contract into chunks
 */
export function chunkContractText(contractText: string, chunkSize: i32 = 5000): string[] {
  const result: string[] = [];
  
  let start: i32 = 0;
  while (start < contractText.length) {
    let end: i32 = start + chunkSize;

    // If we are not at the end of the text, find the nearest full stop to split cleanly
    if (end < contractText.length) {
      const lastPeriodIndex: i32 = contractText.lastIndexOf('.', end);
      if (lastPeriodIndex > start) {
        end = lastPeriodIndex + 1; // include the full stop
      }
    }

    const chunk: string = contractText.slice(start, end).trim();
    result.push(chunk);

    start = end;
  }

  return result;
}


/**
 * Generate embedding for a single piece of text
 */
function generateEmbedding(text: string): f32[] {
  const model = models.getModel<EmbeddingsModel>("minilm")
  const input = model.createInput([text])
  const output = model.invoke(input)
  return output.predictions[0]
}

/**
 * Store entity and text with embedding in Neo4j
 */
function storeEntityAndText(entityName: string, text: string): void {
  const embedding = generateEmbedding(text)
  
  const vars = new neo4j.Variables()
  vars.set("entityName", entityName)
  vars.set("text", text)
  vars.set("embedding", embedding)

  const query = `
  MERGE (e:ContractEntity {name: $entityName})
  CREATE (t:ContractText {
    text: $text,
    embedding: $embedding
  })
  CREATE (t)-[:BELONGS_TO]->(e)
  `

  neo4j.executeQuery(hostName, query, vars)
}

/**
 * Get existing entities from Neo4j
 */
function getExistingEntities(): string[] {
  const query = `
  MATCH (e:ContractEntity)
  RETURN e.name AS name
  `
  
  const result = neo4j.executeQuery(hostName, query)
  const entities: string[] = []

  for (let i = 0; i < result.Records.length; i++) {
    entities.push(result.Records[i].getValue<string>("name"))
  }

  return entities
}

/* process single chunk of contract text */

function processChunk(chunk: string, isFirstChunk: boolean): void {
  let prompt: string
  
  if (isFirstChunk) {
    prompt = INITIAL_ENTITY_PROMPT
  } else {
    // Get existing entities and format them for the prompt
    const existingEntities = getExistingEntities()
    const entitiesList = existingEntities.join(", ")
    prompt = SUBSEQUENT_CHUNK_PROMPT.replace("{{ENTITIES}}", entitiesList)
  }

  const model = models.getModel<OpenAIChatModel>("text-generator2")
  
  const input = model.createInput([
    new SystemMessage(prompt),
    new UserMessage(chunk)
  ])
  input.temperature = 0.1
  
  const output = model.invoke(input)
  const entityTextPairs = JSON.parse<EntityTextPair[]>(output.choices[0].message.content)
  
  for (let i = 0; i < entityTextPairs.length; i++) {
    const pair = entityTextPairs[i]
    storeEntityAndText(pair.entity_name, pair.relevant_text)
  }
}

/**
 * Main function to process entire contract
 */
export function processContract(contractText: string): ContractExplanation[] {

  console.log(contractText)
  // Create vector index if it doesn't exist
  const indexQuery = `CREATE VECTOR INDEX contract_text_index IF NOT EXISTS FOR (t:ContractText) ON (t.embedding)`
  neo4j.executeQuery(hostName, indexQuery)
  
  // Split contract into chunks
  const chunks = chunkContractText(contractText)
  console.log(chunks.length.toString())
  // Process first chunk
  processChunk(chunks[0], true)
  
  // Process remaining chunks

  for (let i = 1; i < chunks.length; i++) {
    processChunk(chunks[i], false)
  }

  return explainContractClauses()
}

function explainContractClauses(): ContractExplanation[] {

  // Get all entities
  const query = `
  MATCH (e:ContractEntity)
  RETURN e.name AS name
  ORDER BY e.name
  `
  
  const result = neo4j.executeQuery(hostName, query)
  const explanations: ContractExplanation[] = []
  
  // Process each entity
  for (let i = 0; i < result.Records.length; i++) {
    const entityName = result.Records[i].getValue<string>("name")
    
    // Get all text associated with this entity - Fixed parameter passing
    const vars = new neo4j.Variables()
    vars.set("entityName", entityName)
    
    const textQuery = `
    MATCH (t:ContractText)-[:BELONGS_TO]->(e:ContractEntity {name: $entityName})
    RETURN t.text AS text
    `
    
    const textResult = neo4j.executeQuery(hostName, textQuery, vars)
    const texts: string[] = []
    
    for (let j = 0; j < textResult.Records.length; j++) {
      texts.push(textResult.Records[j].getValue<string>("text"))
    }
    
    const combinedText = texts.join("\n\n")
    
    const model = models.getModel<OpenAIChatModel>("text-generator")
    
    const prompt = EXPLANATION_PROMPT
      .replace("{{ENTITY_NAME}}", entityName)
      .replace("{{TEXT}}", combinedText)
    
    const input = model.createInput([
      new SystemMessage(prompt),
      new UserMessage("Please explain this clause and suggest negotiation counters.")
    ])
    input.temperature = 0.1
    
    const output = model.invoke(input)
    const explanation = JSON.parse<ClauseExplanation>(output.choices[0].message.content)
    
    const contractExplanation = new ContractExplanation()
    contractExplanation.clause = entityName
    contractExplanation.explanation = explanation
    explanations.push(contractExplanation)
  }
  return explanations
}

/**
 * Find the most similar text segment using vector similarity search
 */
export function findSimilarTextSegment(question: string): string {
  const embedding = generateEmbedding(question)
  
  const vars = new neo4j.Variables()
  vars.set("embedding", embedding)
  vars.set("limit", 1) // Only get the top 1 most similar
  
  const query = `
  CALL db.index.vector.queryNodes('contract_text_index', $limit, $embedding)
  YIELD node, score
  RETURN node.text AS text
  ORDER BY score DESC
  LIMIT 1
  
  `
  
  const result = neo4j.executeQuery(hostName, query, vars)
  
  // If no results found, return empty string
  if (result.Records.length === 0) {
    return ""
  }
  
  return result.Records[0].getValue<string>("text")
}

/**
 * Get all text segments under the same entity as a specific text segment
 */
function getAllTextsFromSameEntity(textSegment: string): string[] {
  const vars = new neo4j.Variables()
  vars.set("text", textSegment)
  
  const query = `
  MATCH (t:ContractText {text: $text})-[:BELONGS_TO]->(e:ContractEntity)
  MATCH (otherTexts:ContractText)-[:BELONGS_TO]->(e)
  RETURN otherTexts.text AS text
  `
  
  const result = neo4j.executeQuery(hostName, query, vars)
  const texts: string[] = []
  
  for (let i = 0; i < result.Records.length; i++) {
    texts.push(result.Records[i].getValue<string>("text"))
  }
  
  return texts
}

/**
 * Answer questions about the contract using GraphRAG pattern 
 */
export function answerContractQuestion(question: string): string {
  // Get the most similar text segment
  const mostSimilarText = findSimilarTextSegment(question)
  
  // Initialize context texts array
  let contextTexts: string[] = []
  
  // If we found a relevant text, get all texts from the same entity
  if (mostSimilarText !== "") {
    contextTexts = getAllTextsFromSameEntity(mostSimilarText)
  } else {
    // Fallback to just the empty array if no match found
    console.log("No similar text found for the question")
  }
  
  // If no context texts were found, provide a generic response
  if (contextTexts.length === 0) {
    return "I couldn't find specific information about this in the contract. Please try rephrasing your question or ask about a different aspect of the contract."
  }
  
  // Combine all context texts
  const context = contextTexts.join("\n\n")
  console.log(context)
  
  // Prepare prompt
  const prompt = RAG_PROMPT
    .replace("{{CONTEXT}}", context)
    .replace("{{QUESTION}}", question)
  
  // Get answer from model
  const model = models.getModel<OpenAIChatModel>("text-generator2")
  const input = model.createInput([
    new SystemMessage(prompt),
    new UserMessage(question)
  ])
  input.temperature = 0.1
  
  const output = model.invoke(input)
  return output.choices[0].message.content
}

/**
 * Generate a professional email response for contract negotiation
 * Takes in the text lists of accepted, rejected, and countered clauses
 */
export function generateNegotiationEmail(
  acceptedClausesText: string,
  rejectedClausesText: string,
  counteredClausesText: string
): string {

  console.log(acceptedClausesText)
  console.log(rejectedClausesText)
  console.log(counteredClausesText)

  const model = models.getModel<OpenAIChatModel>("text-generator2")
  
  const emailPrompt = `
You are an expert in drafting professional business correspondence. Write an email response regarding a contract negotiation that sounds exactly as if the sender wrote it themselves. 

The email should address the following:

1. Accepted clauses:
${acceptedClausesText}

2. Rejected clauses:
${rejectedClausesText}

3. Countered clauses (with proposed changes):
${counteredClausesText}

Guidelines:
- Write in a professional, cordial tone that maintains good business relationships
- Be clear but diplomatic about rejections and counter-proposals
- Briefly acknowledge accepted clauses without lengthy explanations , just one or two sentences.
- For rejected clauses, provide a brief, reasonable justification
- For countered clauses, clearly explain the proposed alternative
- Keep the email concise but thorough
- The email should feel personal, not AI-generated
- Include appropriate opening and closing
- Use natural language and avoid overly formal legal jargon
- Do not include placeholder text like "[Insert name]" - use "Dear [Recipient]" instead
- directly provide the email body without any additional text.
`

  const input = model.createInput([
    new SystemMessage(emailPrompt),
    new UserMessage("Please draft the email response for my contract negotiation.")
  ])
  
  input.temperature = 0.4
  
  const output = model.invoke(input)
  return output.choices[0].message.content
}