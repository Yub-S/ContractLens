import { Clause } from '../types';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8686/graphql';

async function fetchGraphQL(query: string, variables: any = {}) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data, errors } = await response.json();
    
    if (errors) {
      throw new Error(errors[0]?.message || 'GraphQL error occurred');
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function processContract(contractText: string): Promise<Clause[]> {
  const query = `
    query($contractText: String!) {
      processContract(contractText: $contractText) {
        clause
        explanation {
          meaning
          counters
        }
      }
    }
  `;

  const { data } = await fetchGraphQL(query, { contractText });
  
  // Transform the backend response to match our frontend Clause type
  return data.processContract.map((item: any, index: number) => ({
    id: (index + 1).toString(),
    title: item.clause,
    content: item.clause,
    meaning: item.explanation.meaning,
    potentialCounters: item.explanation.counters,
    status: 'pending'
  }));
}

export async function chatWithAI(question: string): Promise<string> {
  const query = `
    query($question: String!) {
      answerContractQuestion(question: $question)
    }
  `;

  const { data } = await fetchGraphQL(query, { question });
  return data.answerContractQuestion;
}

export async function generateNegotiationEmail(
  acceptedClausesText: string,
  rejectedClausesText: string,
  counteredClausesText: string
): Promise<string> {
  const query = `
    query($acceptedClausesText: String!, $rejectedClausesText: String!, $counteredClausesText: String!) {
      generateNegotiationEmail(
        acceptedClausesText: $acceptedClausesText,
        rejectedClausesText: $rejectedClausesText,
        counteredClausesText: $counteredClausesText
      )
    }
  `;

  const { data } = await fetchGraphQL(query, {
    acceptedClausesText,
    rejectedClausesText,
    counteredClausesText
  });
  
  return data.generateNegotiationEmail;
}