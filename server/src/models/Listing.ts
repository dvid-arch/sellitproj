import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
    title: string;
    price: number;
    category: string;
    description: string;
    imageUrl: string;
    images: string[];
    seller: mongoose.Types.ObjectId; // Reference to User
    location: string;
    isUrgent: boolean;
    isNegotiable: boolean;
    status: 'available' | 'sold' | 'pending' | 'committed';
    viewCount: number;
    offerCount: number;
    createdAt: Date;
}

const ListingSchema: Schema = new Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    images: [{ type: String }],
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: false },
    isUrgent: { type: Boolean, default: false },
    isNegotiable: { type: Boolean, default: true },
    status: { type: String, enum: ['available', 'sold', 'pending', 'committed'], default: 'available' },
    viewCount: { type: Number, default: 0 },
    offerCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IListing>('Listing', ListingSchema);
