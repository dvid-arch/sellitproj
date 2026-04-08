import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Listing from './models/Listing';
import Broadcast from './models/Broadcast';
import Notification from './models/Notification';
import Chat from './models/Chat';

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected!');

        console.log('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Listing.deleteMany({}),
            Broadcast.deleteMany({}),
            Notification.deleteMany({}),
            Chat.deleteMany({ isSupport: false }) // Keep support chat if possible, or recreate
        ]);

        console.log('Creating users...');
        const staticIds = {
            obokobong: new mongoose.Types.ObjectId('65c19d7a9f7a8b2c4d5e6f7b'),
            sarah: new mongoose.Types.ObjectId('65c19d7a9f7a8b2c4d5e6f7c'),
            david: new mongoose.Types.ObjectId('65c19d7a9f7a8b2c4d5e6f7d'),
            emeka: new mongoose.Types.ObjectId('65c19d7a9f7a8b2c4d5e6f7e')
        };

        const users = await Promise.all([
            User.create({
                _id: staticIds.obokobong,
                name: 'Obokobong',
                email: 'obokobong@example.com',
                password: 'password123',
                location: 'Moremi Hall',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                campus: 'Main Campus',
                hostel: 'Moremi Hall'
            }),
            User.create({
                _id: staticIds.sarah,
                name: 'Sarah Chen',
                email: 'sarah@example.com',
                password: 'password123',
                location: 'NDDC Hostel',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                campus: 'Main Campus',
                hostel: 'NDDC Hostel'
            }),
            User.create({
                _id: staticIds.david,
                name: 'David Okon',
                email: 'david@example.com',
                password: 'password123',
                location: 'Silver Hall',
                avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
                campus: 'Annexe Campus',
                hostel: 'Silver Hall'
            }),
            User.create({
                _id: staticIds.emeka,
                name: 'Emeka Kalu',
                email: 'emeka@example.com',
                password: 'password123',
                location: 'Hall 2',
                avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
                campus: 'Main Campus',
                hostel: 'Hall 2'
            })
        ]);

        const [obokobong, sarah, david, emeka] = users;

        console.log('Creating listings...');
        await Listing.create([
            {
                title: 'Mini Refrigerator',
                price: 65000,
                category: 'Electronics',
                isUrgent: true,
                isNegotiable: true,
                description: 'Compact fridge perfect for dorm rooms. Keeps drinks cold and snacks fresh. Barely used, moving out sale!',
                imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=800&auto=format&fit=crop',
                seller: obokobong.id,
                location: 'Moremi Hall',
                status: 'available',
                viewCount: 45,
                offerCount: 3
            },
            {
                title: 'HP Laptop',
                price: 275000,
                category: 'Electronics',
                description: 'HP Pavilion 15, 8GB RAM, 256GB SSD, Intel i5. Great for coding and multimedia. Comes with charger and laptop bag.',
                imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop',
                seller: sarah.id,
                location: 'NDDC Hostel',
                status: 'available',
                viewCount: 120,
                offerCount: 1
            },
            {
                title: 'Engineering Textbook Bundle',
                price: 15000,
                category: 'Books',
                description: 'Complete set of 200L Engineering textbooks. Clean condition. Includes Calculus, which is brand new.',
                imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
                seller: david.id,
                location: 'Silver Hall',
                status: 'available',
                viewCount: 12,
                offerCount: 0
            },
            {
                title: 'IKEA Desk Lamp',
                price: 8000,
                category: 'Furniture',
                description: 'Adjustable desk lamp, white. Bulb included. Moving out so need it gone ASAP.',
                imageUrl: 'https://images.unsplash.com/photo-1534281303254-c94ec592dd85?q=80&w=800&auto=format&fit=crop',
                seller: emeka.id,
                location: 'Hall 2',
                status: 'available',
                viewCount: 28,
                offerCount: 1
            }
        ]);

        console.log('Creating broadcasts...');
        await Broadcast.create([
            {
                author: sarah.id,
                need: 'Looking for a Study Lamp',
                details: 'Need a good reading lamp for late-night study sessions. Preferably with adjustable brightness.',
                budgetMin: 5000,
                budgetMax: 15000,
                location: 'Moremi Hall',
                category: 'Electronics',
                isBoosted: false
            },
            {
                author: obokobong.id,
                need: 'Need a scientific calculator',
                details: 'Lost mine properly. Any Casio fx-991EX available?',
                budgetMin: 5000,
                budgetMax: 10000,
                location: 'Moremi Hall',
                category: 'Education',
                isBoosted: true
            }
        ]);

        console.log('Creating notifications...');
        await Notification.create([
            {
                recipient: obokobong.id,
                type: 'match',
                title: 'New Match for your Broadcast!',
                message: 'Someone just listed a "Scientific Calculator" that matches your request.',
                time: new Date(),
                isRead: false,
                relatedImage: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=150&auto=format&fit=crop',
                actionLabel: 'View Item',
                actionPayload: { type: 'view_listing', id: '1' }
            }
        ]);

        console.log('Creating support chat...');
        await Chat.create({
            _id: new mongoose.Types.ObjectId('65c19d7a9f7a8b2c4d5e6f7a'), // Fixed ID for support
            participants: [obokobong.id, sarah.id], // Use two users as dummy participants
            isSupport: true,
            product: {
                title: 'General Support',
                price: 0,
                imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150'
            },
            messages: [
                {
                    text: 'Hello! This is the human support desk. How can we help you today?',
                    sender: sarah.id, // Sarah as "Agent"
                    timestamp: new Date()
                }
            ]
        });

        console.log('Database successfully seeded!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seed();
