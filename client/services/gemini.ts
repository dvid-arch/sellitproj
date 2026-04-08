
import { api } from './api';

export class GeminiService {
  async getSmartAdvice(query: string, history: { role: string; content: string }[]): Promise<{ text: string }> {
    const prompt = `System: You are the Sellit Assistant, a helpful AI for a college campus marketplace. Help students find items, price their items, or give general campus shopping advice. Be concise and friendly.\nHistory: ${JSON.stringify(history)}\nQuery: ${query}`;
    const res = await api.post('/ai/chat', { prompt });
    return { text: res.response };
  }
}

export const geminiService = new GeminiService();
