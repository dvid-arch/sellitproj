"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Broadcast_1 = __importDefault(require("../models/Broadcast"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const broadcasts = await Broadcast_1.default.find().populate('author', 'name email').sort({ createdAt: -1 });
        res.json(broadcasts);
    }
    catch (err) {
        res.status(500).send('Server error');
    }
});
router.post('/', auth_1.auth, async (req, res) => {
    try {
        const { need, details, budgetMin, budgetMax, location, category } = req.body;
        const newBroadcast = new Broadcast_1.default({
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
    }
    catch (err) {
        res.status(500).send('Server error');
    }
});
router.delete('/:id', auth_1.auth, async (req, res) => {
    try {
        const broadcast = await Broadcast_1.default.findById(req.params.id);
        if (!broadcast)
            return res.status(404).json({ message: 'Broadcast not found' });
        if (broadcast.author.toString() !== req.user?.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }
        await broadcast.deleteOne();
        res.json({ message: 'Broadcast removed' });
    }
    catch (err) {
        res.status(500).send('Server error');
    }
});
exports.default = router;
