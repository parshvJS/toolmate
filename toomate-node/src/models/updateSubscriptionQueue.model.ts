import mongoose from "mongoose";

const updateSubscriptionQueueSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    updatePlanDate: {
        type: Date,
        required: true
    },
    type: {
        type: String, // it can be cancel request or suspent request
        required: true
    },
    updatePlanAccessTo: {
        type: Number,
        required: true
    },
    subscriptionId: {
        type: String,
        required: true
    }
},{timestamps:true});

const updateSubscriptionQueue = mongoose.model('updateSubscriptionQueue', updateSubscriptionQueueSchema);
export default updateSubscriptionQueue;