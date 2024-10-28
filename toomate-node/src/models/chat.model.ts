import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema(
	{
		sessionId: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			default: ' ',
		},
		role: {
			type: String,
			default: "ai"
		},
		isProductSuggested: {
			type: Boolean,
			default: false
		},
		isCommunitySuggested: {
			type: Boolean,
			default: false
		},
		communityId: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: 'Community',
			default: []
		},
		// this field will be used for summury product suggestion , sort last data base entry and show that in product suggestion
		productId: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: 'Product',
		}
	},
	{ timestamps: true }
);


ChatSchema.index({ sessionId: 1 });

export const Chat = mongoose.model('Chat', ChatSchema);
