import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
    id: string;
    text: string;
    timestamp: Date;
    senderId: string;
    agentName?: string;
}

export interface IChat extends Document {
    participants: mongoose.Types.ObjectId[];
    lastMessage: string;
    lastMessageTime: Date;
    isSupport: boolean;
    messages: IMessage[];
    product?: {
        listingId: string;
        title: string;
        price: number;
        imageUrl: string;
        status: string;
    };
}

const ChatSchema: Schema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: String },
    lastMessageTime: { type: Date, default: Date.now },
    isSupport: { type: Boolean, default: false },
    messages: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        senderId: { type: String, required: true },
        agentName: { type: String }
    }],
    product: {
        listingId: String,
        title: String,
        price: Number,
        imageUrl: String,
        status: String
    }
});

export default mongoose.model<IChat>('Chat', ChatSchema);
