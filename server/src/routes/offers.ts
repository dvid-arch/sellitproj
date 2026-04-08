import express from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Offer from '../models/Offer';
import Listing from '../models/Listing';

const router = express.Router();

// @route   POST api/offers
// @desc    Create an offer
// @access  Private
router.post('/', auth, async (req: AuthRequest, res) => {
    try {
        const { listingId, price, message } = req.body;

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const newOffer = new Offer({
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
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/offers
// @desc    Get current user's offers (sent or received)
// @access  Private
router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        const offers = await Offer.find({
            $or: [
                { buyer: req.user?.id },
                { seller: req.user?.id }
            ]
        }).populate('listing', 'title price imageUrl')
            .populate('buyer', 'name avatar')
            .populate('seller', 'name avatar')
            .sort({ createdAt: -1 });

        res.json(offers);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PATCH api/offers/:id
// @desc    Update offer status / counter
// @access  Private
router.put('/:id', auth, async (req: AuthRequest, res) => {
    try {
        const { status, price } = req.body;
        let offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Only the seller or buyer can update status
        if (offer.seller.toString() !== req.user?.id && offer.buyer.toString() !== req.user?.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        if (status) offer.status = status;
        if (price) offer.price = price;

        await offer.save();

        // If offer is accepted, mark listing as 'committed'
        if (status === 'accepted') {
            await Listing.findByIdAndUpdate(offer.listing, { status: 'committed' });
        }

        res.json(offer);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/offers/:id
// @desc    Withdraw an offer
// @access  Private
router.delete('/:id', auth, async (req: AuthRequest, res) => {
    try {
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Only the buyer can withdraw their own offer
        if (offer.buyer.toString() !== req.user?.id) {
            return res.status(401).json({ message: 'User not authorized to withdraw this offer' });
        }

        await Offer.findByIdAndDelete(req.params.id);

        // Update listing offer count
        const listing = await Listing.findById(offer.listing);
        if (listing) {
            listing.offerCount = Math.max(0, listing.offerCount - 1);
            await listing.save();
        }

        res.json({ message: 'Offer withdrawn' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

export default router;
