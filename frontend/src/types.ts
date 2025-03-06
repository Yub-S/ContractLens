export interface Clause {
  id: string;
  title: string;
  content: string;
  meaning: string;
  potentialCounters: string[];
  status: 'pending' | 'accepted' | 'rejected';
  counter?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}