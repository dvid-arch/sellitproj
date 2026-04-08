"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Chat_1 = __importDefault(require("../models/Chat"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const chats = await Chat_1.default.find({
            participants: req.user?.id
        }).populate('participants', 'name email avatar');
        res.json(chats);
    }
    catch (err) {
        res.status(500).send('Server error');
    }
});
router.post('/:id/messages', auth_1.auth, async (req, res) => {
    try {
        const chat = await Chat_1.default.findById(req.params.id);
        if (!chat)
            return res.status(404).json({ message: 'Chat not found' });
        const newMessage = {
            id: Math.random().toString(36).substr(2, 9),
            text: req.body.text,
            senderId: req.user.id,
            timestamp: new Date()
        };
        chat.messages.push(newMessage);
        chat.lastMessage = req.body.text;
        chat.lastMessageTime = new Date();
        await chat.save();
        res.json(chat);
    }
    catch (err) {
        res.status(500).send('Server error');
    }
});
// @route   POST api/chats
// @desc    Initialize or find a chat between current user and another user
// @access  Private
router.post('/', auth_1.auth, async (req, res) => {
    try {
        const { participantId, isSupport } = req.body;
        if (req.user?.id === participantId) {
            return res.status(400).json({ message: 'Cannot chat with yourself' });
        }
        // Check if chat already exists
        let chat = await Chat_1.default.findOne({
            participants: { $all: [req.user?.id, participantId] },
            isSupport: isSupport || false
        });
        if (chat) {
            if (req.body.product) {
                chat.product = {
                    ...req.body.product,
                    listingId: req.body.product.listingId || chat.product?.listingId,
                    status: req.body.product.status || chat.product?.status
                };
                await chat.save();
            }
            // Populate participants before returning
            await chat.populate('participants', 'name email avatar');
            return res.json(chat);
        }
        const newChat = new Chat_1.default({
            participants: [req.user?.id, participantId],
            isSupport: isSupport || false,
            messages: [],
            product: req.body.product ? {
                listingId: req.body.product.listingId,
                title: req.body.product.title,
                price: req.body.product.price,
                imageUrl: req.body.product.imageUrl,
                status: req.body.product.status || 'available'
            } : undefined
        });
        chat = await newChat.save();
        await chat.populate('participants', 'name email avatar');
        res.json(chat);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
exports.default = router;
