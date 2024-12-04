import userRefundLogs from "../../models/userRefundLogs.model.js";
import connectDB from "../../db/db.db.js";
import getPaypalAccessToken from "../../utils/paypalUtils.js";
import axios from "axios";
import { Request, Response } from "express";

// Constants
const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;
const DEFAULT_CURRENCY = "USD";
const accessToken = await getPaypalAccessToken();

async function deactivateSubscription(subscriptionId: string, accessToken: string) {
    try {
        const response = await axios.post(
            `${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
            {
                reason: "User requested cancellation.",
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                },
            }
        );
        return { success: true, data: response.data || "Subscription cancelled successfully." };
    } catch (error: any) {
        return { success: false, data: `Error cancelling subscription: ${error.response?.data || error.message}` };
    }
}

// Function to get subscription details
async function getSubscriptionDetails(subscriptionId: string, accessToken: string) {
    try {
        console.log(`Fetching subscription details for ID: ${subscriptionId}`);
        const response = await axios.get(
            `${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        console.log(`Subscription details fetched successfully: ${JSON.stringify(response.data)}`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error(`Failed to get subscription details: ${error.response?.data || error.message}`);
        return { success: false, data: `Failed to get subscription details: ${error.response?.data || error.message}` };
    }
}

// Function to get subscription transactions
async function getSubscriptionTransactions(subscriptionId: string, accessToken: string) {
    try {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 7); // 7-day range
        const endTime = new Date();

        console.log(`Fetching transactions for subscription ID: ${subscriptionId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
        const response = await axios.get(
            `${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}/transactions`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                },
            }
        );
        console.log(`Transactions fetched successfully: ${JSON.stringify(response.data.transactions)}`);
        return { success: true, data: response.data.transactions };
    } catch (error: any) {
        console.error(`Failed to get subscription transactions: ${error.response?.data || error.message}`);
        return { success: false, data: `Failed to get subscription transactions: ${error.response?.data || error.message}` };
    }
}

// Function to issue a refund
async function refundPayment(captureId: string, amount: number | null = null, currency = DEFAULT_CURRENCY, accessToken: string) {
    try {
        const payload = amount
            ? {
                amount: {
                    value: amount,
                    currency_code: currency,
                },
            }
            : {};

        console.log(`Issuing refund for capture ID: ${captureId} with payload: ${JSON.stringify(payload)}`);
        const response = await axios.post(
            `${BASE_PAYPAL_URL}/v2/payments/captures/${captureId}/refund`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`Refund issued successfully: ${JSON.stringify(response.data)}`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error(`Refund failed: ${error.response?.data || error.message}`);
        return { success: false, data: `Refund failed: ${error.response?.data || error.message}` };
    }
}

// Main function to refund based on subscription ID
async function refundSubscription(subscriptionId: string) {
    console.log(`Starting refund process for subscription ID: ${subscriptionId}`);

    // Step 1: Get subscription details
    const subscriptionResult = await getSubscriptionDetails(subscriptionId, accessToken);
    if (!subscriptionResult.success) {
        return { success: false, data: subscriptionResult.data };
    }

    const subscription = subscriptionResult.data;
    const subscriptionStartTime = new Date(subscription.start_time);

    // Step 2: Retrieve subscription transactions
    const transactionsResult = await getSubscriptionTransactions(subscriptionId, accessToken);
    if (!transactionsResult.success) {
        return { success: false, data: transactionsResult.data };
    }

    const transactions = transactionsResult.data;

    if (!transactions || transactions.length === 0) {
        return { success: false, data: "No transactions found for this subscription." };
    }

    // Step 3: Filter for new purchase transactions only
    const newPurchaseTransaction = transactions.find((transaction: any) => {
        const transactionTime = new Date(transaction.time);
        return transactionTime >= subscriptionStartTime && transactionTime <= new Date();
    });

    if (!newPurchaseTransaction) {
        return { success: false, data: "No eligible transactions for refund. This subscription may be a renewal." };
    }

    // Step 4: Issue a refund
    const captureId = newPurchaseTransaction.id;
    const refundResult = await refundPayment(captureId, null, DEFAULT_CURRENCY, accessToken);
    if (!refundResult.success) {
        return { success: false, data: refundResult.data };
    }

    console.log(`Refund process completed successfully for subscription ID: ${subscriptionId}`);
    return { success: true, data: refundResult.data };
}

export async function paymentRefundRequest(req: Request, res: Response) {
    const { subscriptionId, userId } = req.body;

    if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID is required." });
    }

    console.log(`Received refund request for subscription ID: ${subscriptionId} and user ID: ${userId}`);
    const refundResult = await refundSubscription(subscriptionId);
    if (!refundResult.success) {
        console.error("Refund Subscription Error:", refundResult.data);
        return res.status(400).json({ message: "Refund failed.", error: refundResult.data });
    }

    // deactive the plan

    const deactivePlan = await deactivateSubscription(subscriptionId, accessToken);
    if (!deactivePlan.success) {
        console.error("Deactivate Subscription Error:", deactivePlan.data);
        return res.status(400).json({ message: "Deactivate failed.", error: deactivePlan.data });
    }
    await connectDB();

    const refundLog = {
        refundId: refundResult.data.id,
        userId: userId,
    }
    // Log the refund details
    console.log("Refund successful:", refundResult.data);
    const refund = await userRefundLogs.create(refundLog);
    if (!refund) {
        return res.status(500).json({ message: "Refund successful but failed to log refund details." });
    }

    return res.status(200).json({ message: "Refund successful.", refund: refundResult.data });
}



