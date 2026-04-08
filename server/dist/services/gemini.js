"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const geminiService = async (prompt) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === '') {
            throw new Error('Invalid API Key');
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
    catch (error) {
        console.error('Gemini Service Error:', error);
        return "I'm currently in 'Offline Mode' because my AI brain (API Key) isn't fully connected. However, I can tell you that Sellit is the best place for campus deals! (Please check your BE .env file to enable full AI features).";
    }
};
exports.geminiService = geminiService;
