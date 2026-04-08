import express from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import Listing from '../models/Listing';

const router = express.Router();

// @route   GET api/notifications
// @desc    Get current user's notifications
// @access  Private
router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user?.id
        }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PATCH api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', auth, async (req: AuthRequest, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user?.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/notifications/seed
// @desc    Seed test notifications for current user
// @access  Private
router.post('/seed', auth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            console.error('Seed Error: No user ID in request');
            return res.status(401).json({ message: 'Authentication required for seeding' });
        }

        console.log(`Seeding notifications for user: ${userId}`);
        const sampleListing = await Listing.findOne();
        const listingId = sampleListing ? (sampleListing._id || sampleListing.id).toString() : 'sample-id';

        const testNotifications = [
            {
                recipient: userId,
                type: 'offer',
                title: 'New Offer Received!',
                message: 'Someone offered ₦15,000 for your iPhone 13.',
                actionLabel: 'View Offer',
                actionPayload: { type: 'view_offer' }
            },
            {
                recipient: userId,
                type: 'payment',
                title: 'Escrow Secured',
                message: 'Payment for your Macbook has been secured in escrow.',
                actionLabel: 'View Deal',
                actionPayload: { type: 'view_transaction' }
            },
            {
                recipient: userId,
                type: 'match',
                title: 'Found a Match!',
                message: 'A student just listed the "Calculus 101" book you wanted.',
                actionLabel: 'View Listing',
                actionPayload: { type: 'view_listing', id: listingId }
            },
            {
                recipient: userId,
                type: 'price_drop',
                title: 'Price Drop Alert',
                message: 'An item in your saved list just dropped by 10%!',
                actionLabel: 'Check it out',
                actionPayload: { type: 'view_listing', id: listingId }
            },
            {
                recipient: userId,
                type: 'system',
                title: 'Welcome to SellIt!',
                message: 'Start exploring your campus marketplace and find the best deals.',
                actionLabel: 'Browse Now',
                actionPayload: { type: 'navigate_tab', tab: 'Home' }
            },
            {
                recipient: userId,
                type: 'trending',
                title: 'Trending Near You',
                message: 'Check out the most viewed items in your hostel this week.',
                actionLabel: 'See Trends',
                actionPayload: { type: 'navigate_tab', tab: 'Home' }
            }
        ];

        await Notification.insertMany(testNotifications);
        console.log(`Successfully seeded ${testNotifications.length} notifications`);
        res.json({ message: 'Success: Test notifications seeded' });
    } catch (err: any) {
        console.error('Detailed Seed Error:', err.message);
        res.status(500).send('Server error during seeding');
    }
});

export default router;
