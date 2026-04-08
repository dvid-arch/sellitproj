import express from 'express';
import Broadcast from '../models/Broadcast';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const broadcasts = await Broadcast.find().populate('author', 'name email').sort({ createdAt: -1 });
        res.json(broadcasts);
    } catch (err: any) {
        res.status(500).send('Server error');
    }
});

router.post('/', auth, async (req: AuthRequest, res) => {
    try {
        const { need, details, budgetMin, budgetMax, location, category } = req.body;

        const newBroadcast = new Broadcast({
            need,
            details,
            budgetMin,
            budgetMax,
            location,
            category,
            author: req.user?.id
        });

        const broadcast = await newBroadcast.save();
        await broadcast.populate('author', 'name email');
        res.json(broadcast);
    } catch (err: any) {
        res.status(500).send('Server error');
    }
});

router.delete('/:id', auth, async (req: AuthRequest, res) => {
    try {
        const broadcast = await Broadcast.findById(req.params.id);
        if (!broadcast) return res.status(404).json({ message: 'Broadcast not found' });

        if (broadcast.author.toString() !== req.user?.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await broadcast.deleteOne();
        res.json({ message: 'Broadcast removed' });
    } catch (err: any) {
        res.status(500).send('Server error');
    }
});

export default router;
