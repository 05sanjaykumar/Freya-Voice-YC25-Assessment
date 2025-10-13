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
  latency?: number;
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
  avgFirstTokenLatency: number;
  avgTokensPerSec: number;
  totalMessages: number;
  errorCount: number;
}

// ==================== IN-MEMORY STORAGE WITH PERSISTENCE ====================

class InMemoryStore {
  private prompts: Map<string, Prompt> = new Map();
  private sessions: Map<string, Session> = new Map();

  constructor() {
    // Load from localStorage FIRST
    this.loadFromLocalStorage();
    
    // Only seed demo data if storage is empty
    if (this.prompts.size === 0) {
      this.seedDemoData();
      this.saveToLocalStorage(); // Save demo data
    }
  }

  // ==================== PERSISTENCE ====================

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return; // SSR check
    
    try {
      const promptsData = localStorage.getItem('freya_prompts');
      const sessionsData = localStorage.getItem('freya_sessions');
      
      if (promptsData) {
        const parsed = JSON.parse(promptsData);
        this.prompts = new Map(parsed);
        console.log('✅ Loaded prompts from localStorage:', this.prompts.size);
      }
      
      if (sessionsData) {
        const parsed = JSON.parse(sessionsData);
        this.sessions = new Map(parsed);
        console.log('✅ Loaded sessions from localStorage:', this.sessions.size);
      }
    } catch (e) {
      console.error('❌ Failed to load from localStorage:', e);
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return; // SSR check
    
    try {
      // Convert Maps to arrays for JSON serialization
      const promptsArray = Array.from(this.prompts.entries());
      const sessionsArray = Array.from(this.sessions.entries());
      
      localStorage.setItem('freya_prompts', JSON.stringify(promptsArray));
      localStorage.setItem('freya_sessions', JSON.stringify(sessionsArray));
      
      console.log('💾 Saved to localStorage:', {
        prompts: this.prompts.size,
        sessions: this.sessions.size
      });
    } catch (e) {
      console.error('❌ Failed to save to localStorage:', e);
    }
  }

  // ==================== PROMPTS ====================

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
    this.saveToLocalStorage(); // ← SAVE
    return prompt;
  }

  getPrompt(id: string): Prompt | undefined {
    return this.prompts.get(id);
  }

  getAllPrompts(): Prompt[] {
    return Array.from(this.prompts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updatePrompt(id: string, data: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Prompt | null {
    const prompt = this.prompts.get(id);
    if (!prompt) return null;

    const now = new Date().toISOString();
    
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
    this.saveToLocalStorage(); // ← SAVE
    return updated;
  }

  deletePrompt(id: string): boolean {
    const deleted = this.prompts.delete(id);
    if (deleted) this.saveToLocalStorage(); // ← SAVE
    return deleted;
  }

  searchPrompts(query: string): Prompt[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPrompts().filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.body.toLowerCase().includes(lowerQuery) ||
        p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getPromptsByTags(tags: string[]): Prompt[] {
    return this.getAllPrompts().filter((p) =>
      tags.some((tag) => p.tags.includes(tag))
    );
  }

  // ==================== SESSIONS ====================

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
    this.saveToLocalStorage(); // ← SAVE
    console.log('📝 Session created:', session.id);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(limit = 10): Session[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  // Alias for compatibility
  getSessions = this.getAllSessions;

  addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn('⚠️ Session not found:', sessionId);
      return null;
    }

    const newMessage: Message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...message,
    };

    session.messages.push(newMessage);
    session.metrics.totalMessages++;

    this.sessions.set(sessionId, session);
    this.saveToLocalStorage(); // ← SAVE
    console.log('💬 Message added to session:', sessionId, newMessage.role);
    return newMessage;
  }

  updateSessionMetrics(sessionId: string, metrics: Partial<SessionMetrics>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // If new latency data, calculate rolling average
    if (metrics.avgFirstTokenLatency !== undefined) {
      const currentAvg = session.metrics.avgFirstTokenLatency;
      const messageCount = session.messages.filter(m => m.role === 'assistant').length;
      
      // Rolling average
      const newAvg = messageCount > 0
        ? Math.round((currentAvg * (messageCount - 1) + metrics.avgFirstTokenLatency) / messageCount)
        : metrics.avgFirstTokenLatency;
      
      metrics.avgFirstTokenLatency = newAvg;
    }

    // Same for tokens/sec
    if (metrics.avgTokensPerSec !== undefined) {
      const currentAvg = session.metrics.avgTokensPerSec;
      const messageCount = session.messages.filter(m => m.role === 'assistant').length;
      
      const newAvg = messageCount > 0
        ? Math.round((currentAvg * (messageCount - 1) + metrics.avgTokensPerSec) / messageCount)
        : metrics.avgTokensPerSec;
      
      metrics.avgTokensPerSec = newAvg;
    }

    session.metrics = {
      ...session.metrics,
      ...metrics,
    };

    this.sessions.set(sessionId, session);
    this.saveToLocalStorage();
  }


  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn('⚠️ Cannot end session, not found:', sessionId);
      return;
    }

    session.endedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);
    this.saveToLocalStorage(); // ← SAVE
    console.log('🔚 Session ended:', sessionId);
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

  // ==================== UTILITY ====================

  clearAllData() {
    this.prompts.clear();
    this.sessions.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('freya_prompts');
      localStorage.removeItem('freya_sessions');
    }
    console.log('🗑️ All data cleared');
  }

  // ==================== DEMO DATA ====================

  private seedDemoData() {
    console.log('🌱 Seeding demo data...');
    
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
    
    console.log('✅ Demo data seeded');
  }
}

// Export singleton instance
export const store = new InMemoryStore();
