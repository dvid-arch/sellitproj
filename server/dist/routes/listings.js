"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Listing_1 = __importDefault(require("../models/Listing"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// @route   GET /api/listings
router.get('/', async (req, res) => {
    try {
        const listings = await Listing_1.default.find().populate('seller', 'name email avatar').sort({ createdAt: -1 });
        res.json(listings);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   GET /api/listings/:id
router.get('/:id', async (req, res) => {
    try {
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing)
            return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   POST /api/listings
router.post('/', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const newListing = new Listing_1.default({
            ...req.body,
            seller: req.user.id
        });
        const listing = await newListing.save();
        res.json(listing);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   PUT /api/listings/:id
router.put('/:id', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        let listing = await Listing_1.default.findById(req.params.id);
        if (!listing)
            return res.status(404).json({ message: 'Listing not found' });
        // Verify ownership
        if (listing.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this listing' });
        }
        listing = await Listing_1.default.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(listing);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   PUT /api/listings/:id/commit
// @desc    Buyer commits to purchase (escrow)
// @access  Private
router.put('/:id/commit', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing)
            return res.status(404).json({ message: 'Listing not found' });
        if (listing.status !== 'available') {
            return res.status(400).json({ message: 'Listing is not available' });
        }
        // Sellers cannot commit to their own listings
        if (listing.seller.toString() === req.user.id) {
            return res.status(400).json({ message: 'Sellers cannot buy their own item' });
        }
        listing.status = 'committed';
        await listing.save();
        res.json(listing);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   DELETE /api/listings/:id
// @desc    Delete a listing
// @access  Private
router.delete('/:id', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing)
            return res.status(404).json({ message: 'Listing not found' });
        // Verify ownership
        if (listing.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }
        await Listing_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Listing deleted' });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.default = router;
