"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        let user = await User_1.default.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        user = new User_1.default({ name, email, password, phone });
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        user.password = await bcryptjs_1.default.hash(password || 'password123', salt);
        await user.save();
        const payload = { id: user.id, email: user.email };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User_1.default.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const payload = { id: user.id, email: user.email };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// @route   PUT /api/auth/me
router.put('/me', auth_1.auth, async (req, res) => {
    const { name, phone, campus, hostel, bankDetails, savedListings } = req.body;
    try {
        if (!req.user)
            return res.status(401).json({ message: 'User not authenticated' });
        let user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        if (name)
            user.name = name;
        if (phone)
            user.phone = phone;
        if (campus)
            user.campus = campus;
        if (hostel)
            user.hostel = hostel;
        if (bankDetails)
            user.bankDetails = bankDetails;
        if (savedListings)
            user.savedListings = savedListings;
        await user.save();
        res.json(user);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.default = router;
