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
		expression:{
			type:String,
			default:"hello"
		},
		role:{
			type:String,
			default:"ai"
		}
	},
	{ timestamps: true }
);

export const Chat = mongoose.model('Chat', ChatSchema);
