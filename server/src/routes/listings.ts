import express from 'express';
import Listing from '../models/Listing';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/listings
router.get('/', async (req, res) => {
    try {
        const listings = await Listing.find().populate('seller', 'name email avatar').sort({ createdAt: -1 });
        res.json(listings);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/listings/:id
router.get('/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/listings
router.post('/', auth, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const newListing = new Listing({
            ...req.body,
            seller: req.user.id
        });

        const listing = await newListing.save();
        res.json(listing);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/listings/:id
router.put('/:id', auth, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        let listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        // Verify ownership
        if (listing.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this listing' });
        }

        listing = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(listing);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/listings/:id/commit
// @desc    Buyer commits to purchase (escrow)
// @access  Private
router.put('/:id/commit', auth, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

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
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/listings/:id
// @desc    Delete a listing
// @access  Private
router.delete('/:id', auth, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        // Verify ownership
        if (listing.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }

        await Listing.findByIdAndDelete(req.params.id);
        res.json({ message: 'Listing deleted' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
