import express from 'express';
import Chat from '../models/Chat';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user?.id
        }).populate('participants', 'name email avatar');
        res.json(chats);
    } catch (err: any) {
        res.status(500).send('Server error');
    }
});

router.post('/:id/messages', auth, async (req: AuthRequest, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const newMessage = {
            id: Math.random().toString(36).substr(2, 9),
            text: req.body.text,
            senderId: req.user!.id,
            timestamp: new Date()
        };

        chat.messages.push(newMessage);
        chat.lastMessage = req.body.text;
        chat.lastMessageTime = new Date();

        await chat.save();
        res.json(chat);
    } catch (err: any) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/chats
// @desc    Initialize or find a chat between current user and another user
// @access  Private
router.post('/', auth, async (req: AuthRequest, res) => {
    try {
        const { participantId, isSupport } = req.body;

        if (req.user?.id === participantId) {
            return res.status(400).json({ message: 'Cannot chat with yourself' });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({
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

        const newChat = new Chat({
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
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

export default router;
