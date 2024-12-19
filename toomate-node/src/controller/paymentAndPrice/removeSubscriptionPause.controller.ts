import connectDB from "../../db/db.db.js";
import updateSubscriptionQueue from "../../models/updateSubscriptionQueue.model.js";
import userPaymentLogs from "../../models/userPaymentLogs.model.js";
import { Request, Response } from "express";

export async function removeSubscriptionPause(req: Request, res: Response) {
    await connectDB();
    try {
        const { subscriptionId, userId, message } = req.body;
        if (!subscriptionId || !userId) {
            return res.status(400).json({ success: false, data: 'Please provide subscriptionId and userId' });
        }
        const validMessage = ['downgrade', 'suspend', 'cancel'];
        if (!validMessage.includes(message)) {
            return res.status(400).json({ success: false, data: 'Invalid message type. Please provide downgrade, suspend, or cancel' });
        }

        const [existingRequest, existingLog] = await Promise.all([
            updateSubscriptionQueue.findOne({ subscriptionId, userId }).sort({ createdAt: -1 }).limit(1),
            userPaymentLogs.findOne({ subscriptionId, userId }).sort({ createdAt: -1 }).limit(1)
        ]);

        if (!existingRequest) {
            return res.status(404).json({ success: false, data: 'No request found for this subscription' });
        }

        if (existingRequest.type !== message) {
            return res.status(400).json({ success: false, data: 'Invalid message type request doesn`t match' });
        }

        if (!existingLog) {
            return res.status(404).json({ success: false, data: 'No payment logs found transaction never made!' });
        }

        const [removeRequest, newDbLog] = await Promise.all([
            updateSubscriptionQueue.findOneAndDelete({ subscriptionId, userId }),
            userPaymentLogs.create({
                subscriptionId,
                userId,
                status: `Request ${message} Removed : ${existingRequest.type}`,
                isCouponApplied: existingLog.isCouponApplied,
                couponCode: existingLog.couponCode,
                baseBillingPlanId: existingLog.baseBillingPlanId,
                planName: existingLog.planName,
            })
        ]);

        if (!removeRequest) {
            return res.status(500).json({ success: false, data: 'Error removing request' });
        }

        if (!newDbLog) {
            return res.status(500).json({ success: false, data: 'Error creating new log' });
        }

        return res.status(200).json({ success: true, data: 'Request removed successfully' });

    } catch (error: any) {
        return res.status(500).json({ success: false, data: `Error fetching subscription details: ${error.message}` });
    }
}

