import mongoose from 'mongoose';

const userRefundLogsSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		refundId: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const userRefundLogs = mongoose.model('userRefundLogs', userRefundLogsSchema);
export default userRefundLogs;
