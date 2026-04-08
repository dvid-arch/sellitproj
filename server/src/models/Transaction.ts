import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    listingId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    amount: number;
    listingTitle: string;
    partnerName: string;
    type: 'buy' | 'sell';
    status: 'pending' | 'released' | 'cancelled';
    timestamp: Date;
}

const TransactionSchema: Schema = new Schema({
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    listingTitle: { type: String, required: true },
    partnerName: { type: String, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    status: { type: String, enum: ['pending', 'released', 'cancelled'], default: 'released' },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
