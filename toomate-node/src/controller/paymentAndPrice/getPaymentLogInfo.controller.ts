import axios from "axios";
import { Request, Response } from "express";
import connectDB from "../../db/db.db.js";
import getPaypalAccessToken from "../../utils/paypalUtils.js";
import userPaymentLogs from "../../models/userPaymentLogs.model.js";

// Constants
const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;

// Function to get subscription details from PayPal
async function fetchSubscriptionDetails(subscriptionId: string, accessToken: string) {
    try {
        const response = await axios.get(
            `${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, data: `Error fetching subscription details: ${error.response?.data || error.message}` };
    }
}

// Controller to get subscription details
export async function getSubscriptionDetails(req: Request, res: Response) {
    await connectDB();
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID is required." });
    }

    try {
        // Step 1: Get PayPal access token
        const accessToken = await getPaypalAccessToken();


        // Step 2: Fetch subscription details
        const planDetails = await userPaymentLogs.findOne({ subscriptionId: subscriptionId });
        if (!planDetails) {
            return res.status(404).json({ message: "Subscription not found." });
        }
        const planName = planDetails.planName;

        const subscriptionResult = await fetchSubscriptionDetails(subscriptionId, accessToken);
        if (!subscriptionResult.success) {
            return res.status(400).json({ message: "Failed to retrieve subscription details.", error: subscriptionResult.data });
        }
        delete subscriptionResult.data.subscriber
        subscriptionResult.data.planName = planName;
        // Step 3: Return subscription details
        return res.status(200).json({ success: true, subscription: subscriptionResult.data });
    } catch (error: any) {
        console.error("Error retrieving subscription details:", error.message);
        return res.status(500).json({ message: "An error occurred while retrieving subscription details.", error: error.message });
    }
}
