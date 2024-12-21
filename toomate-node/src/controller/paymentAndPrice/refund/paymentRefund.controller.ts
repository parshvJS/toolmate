// Import dependencies
import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import userRefundLogs from "../../../models/userRefundLogs.model.js";
import { UserPayment } from "../../../models/userPayment.model.js";
import connectDB from "../../../db/db.db.js";
import getPaypalAccessToken from "../../../utils/paypalUtils.js";
import UserChat from "../../../models/userChat.model.js";
import userPaymentLogs from "../../../models/userPaymentLogs.model.js";

// Types for better type safety
interface RefundResult {
    success: boolean;
    data: any;
    error?: string;
}

interface PayPalTransaction {
    id: string;
    time: string;
    amount: {
        value: number;
        currency_code: string;
    };
}

// Configuration constants
const CONFIG = {
    PAYPAL_BASE_URL: process.env.PAYPAL_API_BASE_URL,
    DEFAULT_CURRENCY: "USD",
    TRANSACTION_LOOKUP_DAYS: 7,
    HTTP_TIMEOUT: 10000, // 10 seconds
} as const;

// Axios instance for PayPal
const paypalAxios = axios.create({
    baseURL: CONFIG.PAYPAL_BASE_URL,
    timeout: CONFIG.HTTP_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Main refund handler
export async function paymentRefundRequest(req: Request, res: Response) {
    await connectDB();
    try {
        const { subscriptionId, userId } = validateRefundRequest(req);
        const accessToken = await getPaypalAccessToken();
        console.log(`Processing refund for Subscription ID: ${subscriptionId}, User ID: ${userId}`);

        const subscriptionDetails = await getSubscriptionDetails(subscriptionId, accessToken);
        if (!subscriptionDetails.success) {
            throw new Error(subscriptionDetails.error);
        }
        const isEligible = await isEligibleForRefund(userId, String(subscriptionDetails.data.start_time));
        if (!isEligible.success) {
            return res.status(400).json({ message: isEligible.data, success: true });
        }

        const transactions = await getSubscriptionTransactions(subscriptionId, accessToken);
        if (!transactions.success) {
            throw new Error(transactions.error);
        }
        // Deactivate user subscription
        await deactivateSubscription(subscriptionId, accessToken);

        const eligibleTransaction = findEligibleTransaction(transactions.data, new Date(subscriptionDetails.data.start_time));
        console.log("Eligible transaction:", eligibleTransaction);
        if (!eligibleTransaction) {
            return res.status(400).json({ message: "No eligible transactions for refund." });
        }

        const refundResult = await refundPayment(eligibleTransaction.id, null, CONFIG.DEFAULT_CURRENCY, accessToken);
        console.log("Refund result:------------:", refundResult);
        if (!refundResult.success) {
            throw new Error(refundResult.error);
        }

        const refundDetails = await getRefundDetailsFromPayPal(refundResult.data.id, accessToken);
        console.log("Refund details:", refundDetails);
        await connectDB();

        // Save refund logs
        await userRefundLogs.create({
            refundId: refundResult.data.id,
            userId,
            status: refundResult.data.status,
            amount: `${refundDetails.data.amount.value} ${refundDetails.data.amount.currency_code}`,
        });

        // Update payment logs
        const paymentLog = await userPaymentLogs.findOne({ userId, subscriptionId });
        if (!paymentLog) {
            return res.status(404).json({ message: "Payment log not found.", success: false });
        }

        const newLogData = {
            userId,
            subscriptionId,
            isCouponApplied: paymentLog.isCouponApplied,
            couponCode: paymentLog.couponCode,
            baseBillingPlanId: paymentLog.baseBillingPlanId,
            planName: paymentLog.planName,
            status: "Subscription CANCELLED Refund Issued And Processing.",
        };
        await userPaymentLogs.create(newLogData);

        return res.status(200).json({
            message: "Refund processed successfully.",
            refund: refundResult.data,
        });

    } catch (error: any) {
        console.error("Refund failed:", error);
        return res.status(500).json({ message: "An error occurred during refund processing.", error: error.message });
    }
}


// refund info

async function getRefundDetailsFromPayPal(refundId: string, accessToken: string) {
    try {
        const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;
        const response = await axios.get(
            `${BASE_API_URL}/v2/payments/refunds/${refundId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, data: `Failed to fetch refund details: ${error.response?.data || error.message}` };
    }
}


// Validate request
function validateRefundRequest(req: Request) {
    const { subscriptionId, userId } = req.body;
    if (!subscriptionId || !userId) {
        throw new Error("Subscription ID and User ID are required.");
    }
    return { subscriptionId, userId };
}

// Get subscription details
async function getSubscriptionDetails(subscriptionId: string, accessToken: string): Promise<RefundResult> {
    try {
        const response = await paypalAxios.get(`/v1/billing/subscriptions/${subscriptionId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, data: null, error: `Failed to fetch subscription details: ${error.message}` };
    }
}

// Get subscription transactions
async function getSubscriptionTransactions(subscriptionId: string, accessToken: string): Promise<RefundResult> {
    try {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - CONFIG.TRANSACTION_LOOKUP_DAYS);

        const response = await paypalAxios.get(`/v1/billing/subscriptions/${subscriptionId}/transactions`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
                start_time: startTime.toISOString(),
                end_time: new Date().toISOString(),
            },
        });

        return { success: true, data: response.data.transactions };
    } catch (error: any) {
        return { success: false, data: null, error: `Failed to fetch subscription transactions: ${error.message}` };
    }
}

// Refund payment
async function refundPayment(captureId: string, amount: number | null, currency: string, accessToken: string): Promise<RefundResult> {
    try {
        const payload = amount ? { amount: { value: amount, currency_code: currency } } : {};

        const response = await paypalAxios.post(`/v2/payments/captures/${captureId}/refund`, payload, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("Refund response:", response.data);

        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, data: null, error: `Refund failed: ${error.message}` };
    }
}

// Deactivate subscription
async function deactivateSubscription(subscriptionId: string, accessToken: string): Promise<RefundResult> {
    try {
        const response = await paypalAxios.post(
            `/v1/billing/subscriptions/${subscriptionId}/cancel`,
            { reason: "User requested cancellation" },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, data: null, error: `Failed to deactivate subscription: ${error.message}` };
    }
}

// Find eligible transaction
function findEligibleTransaction(transactions: PayPalTransaction[], startTime: Date): PayPalTransaction | null {
    console.log("Finding eligible transaction for refund...", transactions);
    return transactions.find(transaction => {
        const transactionTime = new Date(transaction.time);
        return transactionTime >= startTime && transactionTime <= new Date();
    }) || null;
}



async function isEligibleForRefund(userId: string, startTime: string) {
    const subStartTime = new Date(startTime);
    const currTime = new Date();

    const timeDifference = currTime.getTime() - subStartTime.getTime();
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    if (!(daysDifference <= 7)) {
        return {
            success: false,
            data: "Subscription is not eligible for refund. Refund can only be requested within 7 days of subscription start date."
        }
    }

    const chats = await UserChat.findOne({ userId });
    if (chats) {
        return {
            success: false,
            data: "Subscription is not eligible for refund. User has started using the premium service."
        }
    }

    return {
        success: true,
        data: "Subscription is eligible for refund."
    }
}