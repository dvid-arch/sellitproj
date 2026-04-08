import express from 'express';
import { geminiService } from '../services/gemini';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/chat', auth, async (req: AuthRequest, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

        const response = await geminiService(prompt);
        res.json({ response });
    } catch (err: any) {
        console.error(err);
        res.status(500).send('AI service error');
    }
});

export default router;
