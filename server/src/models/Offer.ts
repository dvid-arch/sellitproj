import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
    listing: mongoose.Types.ObjectId;
    buyer: mongoose.Types.ObjectId;
    seller: mongoose.Types.ObjectId;
    price: number;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
    createdAt: Date;
}

const OfferSchema: Schema = new Schema({
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    message: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'countered'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IOffer>('Offer', OfferSchema);
