import axios from 'axios';
import connectDB from '../../db/db.db.js';
import { Request, Response } from 'express';
import getPaypalAccessToken from '../../utils/paypalUtils.js';
import updateSubscriptionQueue from '../../models/updateSubscriptionQueue.model.js';
import userPaymentLogs from '../../models/userPaymentLogs.model.js';
// user can suspend their subscription

const accessToken = await getPaypalAccessToken();
const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;
async function getSubscriptionDetails(subscriptionId: string) {
	try {
		const response = await axios.get(
			`${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		);
		console.log('Subscription details:', response.data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return {
			success: false,
			data: `Error fetching subscription details: ${ error.message}`,
		};
	}
}

export async function requestSubscriptionPause(req: Request, res: Response) {
	try {
		const {
			subscriptionId,
			userId,
			message,
			isDownGradeRequest,
			downGradeDuration,
		} = req.body;

		if (!subscriptionId || !userId || !message) {
			return res.status(400).json({
				success: false,
				status: 400,
				message: 'Please provide subscriptionId, userId, and message',
			});
		}

		if (
			message !== 'downgrade' &&
			message !== 'suspend' &&
			message !== 'cancel'
		) {
			return res.status(400).json({
				success: false,
				status: 400,
				message:
					'Invalid message type. Please provide downgrade, suspend, or cancel',
			});
		}
		const validDownDate = [1, 6, 12];
		if (
			isDownGradeRequest &&
			!downGradeDuration &&
			!validDownDate.includes(downGradeDuration)
		) {
			return res.status(400).json({
				success: false,
				status: 400,
				message: 'Please provide valid downGradeDuration',
			});
		}
		await connectDB();

		// Fetch subscription details
		const subscriptionDetails =
			await getSubscriptionDetails(subscriptionId);
		if (!subscriptionDetails.success) {
			return res.status(400).json({
				success: false,
				status: 400,
				message: 'Failed to retrieve subscription details',
				error: subscriptionDetails.data,
			});
		}

		const logData = await userPaymentLogs.findOne({ subscriptionId });
		if (!logData) {
			return res.status(404).json({
				success: false,
				status: 404,
				message: 'Subscription log not found',
			});
		}

		// Prepare the new queue document
		const nextBillingDateString =
			subscriptionDetails.data.billing_info.next_billing_time;
		const nextBillingDate: Date = new Date(nextBillingDateString);

		if (isNaN(nextBillingDate.getTime())) {
			return res.status(400).json({
				success: false,
				status: 400,
				message: 'Invalid next billing date format',
			});
		}

		const newQueueDoc = {
			userId: userId,
			updatePlanDate: nextBillingDate.toISOString().split('.')[0] + 'Z', // Remove milliseconds
			type: message,
			updatePlanAccessTo: isDownGradeRequest ? downGradeDuration : 0,
			subscriptionId: subscriptionId,
		};

		// Save the new queue document to the database
		const queueDoc = await updateSubscriptionQueue.create(newQueueDoc);
		if (!queueDoc) {
			return res.status(500).json({
				success: false,
				status: 500,
				message: 'Failed to save the request to the queue',
			});
		}

		// Log the suspension request
		const newLog = {
			userId: userId,
			subscriptionId: subscriptionId,
			isCouponApplied: logData.isCouponApplied,
			couponCode: logData.couponCode,
			baseBillingPlanId: logData.baseBillingPlanId,
			planName: logData.planName,
			status: `${message} request saved to the queue`,
		};

		const logNew = await userPaymentLogs.create(newLog);
		if (!logNew) {
			return res.status(500).json({
				success: false,
				status: 500,
				message: 'Failed to save the log',
			});
		}

		return res.status(200).json({
			success: true,
			status: 200,
			message:
				'Request to suspend subscription has been saved to the queue',
		});
	} catch (error: any) {
		console.error('Error processing subscription pause request:', error);
		res.status(500).json({
			success: false,
			status: 500,
			message: 'Internal Server Error',
		});
	}
}
