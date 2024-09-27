import mongoose, { Document, Model } from 'mongoose';

export interface User extends Document {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	imageUrl?: string;
	clerkUserId?: string;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
	{
		id: {
			type: String,
			default: () => new mongoose.Types.ObjectId().toString(),
			unique: true,
		},
		email: {
			type: String,
			required: [true, 'Email is required!'],
			unique: true,
		},
		firstName: {
			type: String,
		},
		lastName: {
			type: String,
		},
		imageUrl: {
			type: String,
		},
		clerkUserId: {
			type: String,
			unique: true,
		},
		subscription: {
			type: String,
			default: 'free',
		},
		subscriptionId: {
			type: String,
			default: '',
		},
		stripeSubscriptionId: {
			type: String,
			default: '',
		},
		validTill: {
			type: Date,
			default: Date.now() - 1000,
		},
	},
	{ timestamps: true }
);

const User: Model<User> = mongoose.model<User>('User', UserSchema);

export default User;
