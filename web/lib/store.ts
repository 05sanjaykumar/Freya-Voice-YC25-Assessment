export interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versions?: PromptVersion[];
}

export interface PromptVersion {
  body: string;
  timestamp: string;
}

export interface Session {
  id: string;
  promptId: string;
  startedAt: string;
  endedAt?: string;
  messages: Message[];
  metrics: SessionMetrics;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  latency?: number;
}

export interface SessionMetrics {
  avgFirstTokenLatency: number;
  avgTokensPerSec: number;
  errorCount: number;
}

class InMemoryStore {
  private prompts: Map<string, Prompt> = new Map();
  private sessions: Map<string, Session> = new Map();

  // Prompt CRUD
  createPrompt(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) { }
  getPrompt(id: string) { }
  updatePrompt(id: string, data: Partial<Prompt>) { }
  deletePrompt(id: string) { }
  getAllPrompts() { }
  searchPrompts(query: string) { }

  // Session management
  createSession(promptId: string) { }
  getSession(id: string) { }
  getAllSessions(limit = 10) { }
  addMessage(sessionId: string, message: Message) { }
  updateMetrics(sessionId: string, metrics: Partial<SessionMetrics>) { }
}

export const store = new InMemoryStore();
