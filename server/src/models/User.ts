import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    location?: string;
    avatar?: string;
    campus?: string;
    hostel?: string;
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
    savedListings: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    location: { type: String },
    avatar: { type: String },
    campus: { type: String },
    hostel: { type: String },
    bankDetails: {
        bankName: { type: String },
        accountNumber: { type: String },
        accountName: { type: String }
    },
    savedListings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
