import connectDB from '../../db/db.db.js';
import userRefundLogs from '../../models/userRefundLogs.model.js';
import getPaypalAccessToken from '../../utils/paypalUtils.js';
import axios from 'axios';
import { Request, Response } from 'express';

// Constants
const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;
const accessToken = await getPaypalAccessToken();

/**
 * Fetches refund details from PayPal using the refund ID.
 * @param refundId - The PayPal refund ID.
 * @param accessToken - PayPal access token.
 */
async function getRefundDetailsFromPayPal(refundId: string, accessToken: string) {
    try {
        const response = await axios.get(
            `${BASE_PAYPAL_URL}/v2/payments/refunds/${refundId}`,
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

/**
 * Fetches refund logs for a user and retrieves details from PayPal for each refund.
 * @param req - Express request object.
 * @param res - Express response object.
 */
export async function getRefundLogs(req: Request, res: Response) {
    await connectDB();

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        // Fetch refund logs from the database
        const refundLogs = await userRefundLogs.find({ userId }).sort({ createdAt: -1 });

        if (refundLogs.length === 0) {
            return res.status(404).json({ message: 'No refund logs found.' });
        }

        // Retrieve refund details from PayPal for each refund ID
        const refundDetails = await Promise.all(
            refundLogs.map(async (log) => {
                const paypalRefund = await getRefundDetailsFromPayPal(log.refundId, accessToken);
                return {
                    ...log.toObject(),
                    paypalRefund: paypalRefund.success ? paypalRefund.data : paypalRefund.data,
                };
            })
        );

        return res.status(200).json({ logs: refundDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}
