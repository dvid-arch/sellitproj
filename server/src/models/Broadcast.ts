import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcast extends Document {
    author: mongoose.Types.ObjectId;
    need: string;
    details: string;
    budgetMin: number;
    budgetMax: number;
    location: string;
    category: string;
    isBoosted: boolean;
    createdAt: Date;
}

const BroadcastSchema: Schema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    need: { type: String, required: true },
    details: { type: String, required: true },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    isBoosted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IBroadcast>('Broadcast', BroadcastSchema);
