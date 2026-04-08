import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    type: 'match' | 'price_drop' | 'offer' | 'system' | 'trending' | 'payment';
    title: string;
    message: string;
    isRead: boolean;
    relatedImage?: string;
    actionLabel?: string;
    actionPayload?: {
        type: string;
        id?: string;
        tab?: string;
    };
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['match', 'price_drop', 'offer', 'system', 'trending', 'payment'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedImage: { type: String },
    actionLabel: { type: String },
    actionPayload: {
        type: { type: String },
        id: { type: String },
        tab: { type: String }
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
