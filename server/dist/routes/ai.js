"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gemini_1 = require("../services/gemini");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/chat', auth_1.auth, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt)
            return res.status(400).json({ message: 'Prompt is required' });
        const response = await (0, gemini_1.geminiService)(prompt);
        res.json({ response });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('AI service error');
    }
});
exports.default = router;
