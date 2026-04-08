import { GoogleGenerativeAI } from '@google/generative-ai';

export const geminiService = async (prompt: string) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === '') {
            throw new Error('Invalid API Key');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini Service Error:', error);
        return "I'm currently in 'Offline Mode' because my AI brain (API Key) isn't fully connected. However, I can tell you that Sellit is the best place for campus deals! (Please check your BE .env file to enable full AI features).";
    }
};
