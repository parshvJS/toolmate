import connectDB from "../../../db/db.db.js";
import UserChat from "../../../models/userChat.model.js";
import getPaypalAccessToken from "../../../utils/paypalUtils.js";
import axios from "axios";
import { Request, Response } from "express";

export async function isEligibleForRefund(req: Request, res: Response) {
    await connectDB();
    try {
        const { userId, subscriptionId } = req.body;
        if (!userId || !subscriptionId) {
            return res.status(400).json({
                message: "User ID and Subscription ID are required",
                success: false
            });
        }

        const subscriptionData = await getSubscriptionData(subscriptionId);
        if (!subscriptionData.success) {
            return res.status(404).json({
                message: subscriptionData.data,
                success: false
            });
        }
        const startTime = subscriptionData.data.start_time;
        const subStartTime = new Date(startTime);
        const currTime = new Date();

        const timeDifference = currTime.getTime() - subStartTime.getTime();
        const daysDifference = timeDifference / (1000 * 3600 * 24);

        if (!(daysDifference <= 7)) {
            return res.status(400).json({
                message: "Subscription is not eligible for refund. Refund can only be requested within 7 days of subscription start date.",
                isEligible: false,
                success: false
            });
        }

        const chats = await UserChat.findOne({ userId });
        if (chats) {
            return res.status(400).json({
                message: "Subscription is not eligible for refund. User has started using the premium service.",
                isEligible: false,
                success: false
            });
        }

        return res.status(200).json({
            message: "Subscription is eligible for refund.",
            isEligible: true,
            success: true
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            success: false
        });
    }
}

async function getSubscriptionData(subscriptionId: string) {
    try {
        const accessToken = await getPaypalAccessToken();
        const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;
        const response = await axios.get(`${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, data: `Error fetching subscription details: ${error.response?.data || error.message}` };
    }
}

