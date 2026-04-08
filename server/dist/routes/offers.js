"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Offer_1 = __importDefault(require("../models/Offer"));
const Listing_1 = __importDefault(require("../models/Listing"));
const router = express_1.default.Router();
// @route   POST api/offers
// @desc    Create an offer
// @access  Private
router.post('/', auth_1.auth, async (req, res) => {
    try {
        const { listingId, price, message } = req.body;
        const listing = await Listing_1.default.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        const newOffer = new Offer_1.default({
            listing: listingId,
            buyer: req.user?.id,
            seller: listing.seller,
            price,
            message,
            status: 'pending'
        });
        const offer = await newOffer.save();
        // Update listing offer count
        listing.offerCount += 1;
        await listing.save();
        res.json(offer);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// @route   GET api/offers
// @desc    Get current user's offers (sent or received)
// @access  Private
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const offers = await Offer_1.default.find({
            $or: [
                { buyer: req.user?.id },
                { seller: req.user?.id }
            ]
        }).populate('listing', 'title price imageUrl')
            .populate('buyer', 'name avatar')
            .populate('seller', 'name avatar')
            .sort({ createdAt: -1 });
        res.json(offers);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// @route   PATCH api/offers/:id
// @desc    Update offer status / counter
// @access  Private
router.put('/:id', auth_1.auth, async (req, res) => {
    try {
        const { status, price } = req.body;
        let offer = await Offer_1.default.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        // Only the seller or buyer can update status
        if (offer.seller.toString() !== req.user?.id && offer.buyer.toString() !== req.user?.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }
        if (status)
            offer.status = status;
        if (price)
            offer.price = price;
        await offer.save();
        // If offer is accepted, mark listing as 'committed'
        if (status === 'accepted') {
            await Listing_1.default.findByIdAndUpdate(offer.listing, { status: 'committed' });
        }
        res.json(offer);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// @route   DELETE api/offers/:id
// @desc    Withdraw an offer
// @access  Private
router.delete('/:id', auth_1.auth, async (req, res) => {
    try {
        const offer = await Offer_1.default.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        // Only the buyer can withdraw their own offer
        if (offer.buyer.toString() !== req.user?.id) {
            return res.status(401).json({ message: 'User not authorized to withdraw this offer' });
        }
        await Offer_1.default.findByIdAndDelete(req.params.id);
        // Update listing offer count
        const listing = await Listing_1.default.findById(offer.listing);
        if (listing) {
            listing.offerCount = Math.max(0, listing.offerCount - 1);
            await listing.save();
        }
        res.json({ message: 'Offer withdrawn' });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
exports.default = router;
