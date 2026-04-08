import express from 'express';
import Transaction from '../models/Transaction';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/transactions
router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const transactions = await Transaction.find({
            $or: [{ sellerId: req.user.id }, { buyerId: req.user.id }]
        }).sort({ timestamp: -1 });
        res.json(transactions);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
