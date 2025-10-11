// web/lib/store.ts
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================

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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  latency?: number; // milliseconds to first token
  tokensPerSec?: number;
}

export interface Session {
  id: string;
  promptId: string;
  promptTitle: string;
  startedAt: string;
  endedAt?: string;
  messages: Message[];
  metrics: SessionMetrics;
}

export interface SessionMetrics {
  avgFirstTokenLatency: number; // ms
  avgTokensPerSec: number;
  totalMessages: number;
  errorCount: number;
}

// ==================== IN-MEMORY STORAGE ====================

class InMemoryStore {
  private prompts: Map<string, Prompt> = new Map();
  private sessions: Map<string, Session> = new Map();

  constructor() {
    // Initialize with demo data
    this.seedDemoData();
  }

  // ==================== PROMPTS ====================

  // Create
  createPrompt(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Prompt {
    const now = new Date().toISOString();
    const prompt: Prompt = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      versions: [{ body: data.body, timestamp: now }],
    };
    this.prompts.set(prompt.id, prompt);
    return prompt;
  }

  // Read
  getPrompt(id: string): Prompt | undefined {
    return this.prompts.get(id);
  }

  getAllPrompts(): Prompt[] {
    return Array.from(this.prompts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Update
  updatePrompt(id: string, data: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Prompt | null {
    const prompt = this.prompts.get(id);
    if (!prompt) return null;

    const now = new Date().toISOString();
    
    // If body changed, save version
    if (data.body && data.body !== prompt.body) {
      const versions = prompt.versions || [];
      versions.push({ body: data.body, timestamp: now });
      data.versions = versions;
    }

    const updated: Prompt = {
      ...prompt,
      ...data,
      updatedAt: now,
    };
    
    this.prompts.set(id, updated);
    return updated;
  }

  // Delete
  deletePrompt(id: string): boolean {
    return this.prompts.delete(id);
  }

  // Search
  searchPrompts(query: string): Prompt[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPrompts().filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.body.toLowerCase().includes(lowerQuery) ||
        p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter by tags
  getPromptsByTags(tags: string[]): Prompt[] {
    return this.getAllPrompts().filter((p) =>
      tags.some((tag) => p.tags.includes(tag))
    );
  }

  // ==================== SESSIONS ====================

  // Create
  createSession(promptId: string): Session {
    const prompt = this.getPrompt(promptId);
    const session: Session = {
      id: uuidv4(),
      promptId,
      promptTitle: prompt?.title || 'Unknown',
      startedAt: new Date().toISOString(),
      messages: [],
      metrics: {
        avgFirstTokenLatency: 0,
        avgTokensPerSec: 0,
        totalMessages: 0,
        errorCount: 0,
      },
    };
    this.sessions.set(session.id, session);
    return session;
  }

  // Read
  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(limit = 10): Session[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  // Add message to session
  addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const newMessage: Message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...message,
    };

    session.messages.push(newMessage);
    session.metrics.totalMessages++;

    this.sessions.set(sessionId, session);
    return newMessage;
  }

  // Update session metrics
  updateSessionMetrics(sessionId: string, metrics: Partial<SessionMetrics>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.metrics = {
      ...session.metrics,
      ...metrics,
    };

    this.sessions.set(sessionId, session);
  }

  // End session
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);
  }

  // ==================== METRICS ====================

  getGlobalMetrics() {
    const allSessions = Array.from(this.sessions.values());
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentSessions = allSessions.filter(
      (s) => new Date(s.startedAt) > last24h
    );

    const totalLatencies = recentSessions.reduce(
      (sum, s) => sum + s.metrics.avgFirstTokenLatency,
      0
    );
    const totalTokensPerSec = recentSessions.reduce(
      (sum, s) => sum + s.metrics.avgTokensPerSec,
      0
    );
    const totalErrors = recentSessions.reduce(
      (sum, s) => sum + s.metrics.errorCount,
      0
    );
    const totalMessages = recentSessions.reduce(
      (sum, s) => sum + s.metrics.totalMessages,
      0
    );

    return {
      avgFirstTokenLatency:
        recentSessions.length > 0
          ? Math.round(totalLatencies / recentSessions.length)
          : 0,
      avgTokensPerSec:
        recentSessions.length > 0
          ? Math.round(totalTokensPerSec / recentSessions.length)
          : 0,
      errorRate:
        totalMessages > 0
          ? parseFloat(((totalErrors / totalMessages) * 100).toFixed(1))
          : 0,
      totalSessions: allSessions.length,
      last24hSessions: recentSessions.length,
    };
  }

  // ==================== DEMO DATA ====================

  private seedDemoData() {
    // Create demo prompts
    this.createPrompt({
      title: 'Fitness Coach',
      body: 'You are an energetic and motivational fitness coach. Help users achieve their fitness goals with enthusiasm and practical advice. Keep responses concise and actionable.',
      tags: ['health', 'fitness', 'motivation'],
    });

    this.createPrompt({
      title: 'French Tutor',
      body: 'You are a patient French language tutor. Help students learn French through conversation, grammar explanations, and cultural insights. Respond with corrections when needed.',
      tags: ['education', 'language', 'french'],
    });

    this.createPrompt({
      title: 'Code Helper',
      body: 'You are a senior software engineer specializing in Python and JavaScript. Help developers debug code, explain concepts, and suggest best practices. Provide code examples when helpful.',
      tags: ['programming', 'technical', 'education'],
    });

    this.createPrompt({
      title: 'Customer Support',
      body: 'You are a friendly customer support representative. Address customer concerns with empathy, provide clear solutions, and maintain a professional yet warm tone.',
      tags: ['support', 'business', 'communication'],
    });
  }
}

// Export singleton instance
export const store = new InMemoryStore();
