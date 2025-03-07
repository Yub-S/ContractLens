# ContractLens

**ContractLens** is a simple application designed to streamline legal contract analysis using knowledge graphs and LLMs. 

## Key Features

- **Clause Analysis**: Provides clear, simplified explanations of important clauses, their implications, and potential interpretations.
- **Negotiation Assistance**: Suggests counter-negotiation points for unfavorable terms.
- **Intelligent Q&A**: Incorporates a GraphRAG system, allowing users to ask specific questions about any aspect of the contract.
- **Interactive Review**: Enables users to accept, reject, or propose counter-offers for each clause.
- **Professional Summaries**: Generates comprehensive contract review summaries, ready to be shared with other parties involved in negotiations.

## Demo

You can watch a demo of **ContractLens** in action here:

[Watch the Demo](https://drive.google.com/file/d/1G9iux9vJGilEPM2Jc9KjWBefonAep4aF/view?usp=drive_link)

## Project Structure

- **backend**: Built with [Modus](https://docs.hypermode.com/modus/overview), handles the backend operations
- **frontend**: Built using vite and react, provides the frontend interface

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Yub-S/ContractLens.git
cd ContractLens
```

### 2. Backend Setup (backend)

#### Install modus and hyp CLIs

```bash
# Install Modus CLI
npm i -g @hypermode/modus-cli

# Install Hyp CLI and sign in
npm i -g @hypermode/hyp-cli
hyp login
```

#### Configure Environment

Create a `.env.dev.local` file in the backend directory with the following variables:

```bash
MODUS_OPENAI_API_KEY=<YOUR_GROQ_API_KEY>
MODUS_NEO4J_NEO4J_URI=<YOUR_NEO4J_CONNECTION_URI_HERE>
MODUS_NEO4J_NEO4J_USERNAME=<YOUR_NEO4J_USER_HERE>
MODUS_NEO4J_NEO4J_PASSWORD=<YOUR_NEO4J_PASSWORD_HERE>
```
**Note:** You can create a free Neo4j Sandbox instance to obtain your Neo4j credentials by visiting [Neo4j Sandbox](https://sandbox.neo4j.com/).

#### Run the Backend

```bash
cd backend
modus dev
```

### 3. Frontend Setup (frontend)

#### Navigate to Frontend Directory

```bash
cd frontend
```

#### Install Dependencies and Run

```bash
npm install
npm run dev
```
