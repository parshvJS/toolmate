import connectDB from '../../db/db.db.js';
import User from '../../models/user.model.js';
import { UserPayment } from '../../models/userPayment.model.js';
import { Request, Response } from 'express';
import { getRedisData, setRedisData } from '../../services/redis.js';
import updateSubscriptionQueue from '../../models/updateSubscriptionQueue.model.js';
import axios from 'axios';
import getPaypalAccessToken, { getPaypalFormatDate } from '../../utils/paypalUtils.js';
import OverDueList from '../../models/OverDueList.model.js';
import userPaymentLogs from '../../models/userPaymentLogs.model.js';

// Define an interface for the PayPal subscription details
interface PaypalSubscriptionDetails {
	billing_info: {
		next_billing_time: string;
		status: string;
	};
}

async function fetchPaypalSubscription(subscriptionId: string): Promise<PaypalSubscriptionDetails | null> {
	const accessToken = await getPaypalAccessToken();
	const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;

	try {
		const response = await axios.get(
			`${BASE_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		);
		return response.data;
	} catch (error: any) {
		console.error(`Failed to fetch subscription details: ${error.message}`);
		return null;
	}
}

async function pauseSubscriptionIfOverdue(userId: string, subscriptionId: string): Promise<boolean> {
	const subDetails = await fetchPaypalSubscription(subscriptionId);
	if (!subDetails) return false;

	const { next_billing_time: nextBillingTime, status } = subDetails.billing_info;
	const nextBillingCycle = new Date(nextBillingTime);
	const currDate = new Date();

	if (status === "ACTIVE" && currDate > nextBillingCycle) {
		const userPaymentDetails = await UserPayment.findOne({ userId });
		if (!userPaymentDetails) return false;

		await OverDueList.create({ userId, subscriptionId });
		userPaymentDetails.planAccess = [true, false, false];
		userPaymentDetails.activePlan = '';
		await userPaymentDetails.save();

		const previousLog = await userPaymentLogs.findOne({
			userId,
			subscriptionId,
			status: { $in: ["Subscription ACTIVE", "ACTIVE"] },
		});

		await userPaymentLogs.create({
			userId,
			subscriptionId,
			status: 'Subscription PAUSED: Overdue of payment',
			baseBillingPlanId: previousLog?.baseBillingPlanId || '',
			planName: previousLog?.planName || '',
			isCouponApplied: previousLog?.isCouponApplied || false,
			couponCode: previousLog?.couponCode || '',
		});
		return true;
	}

	return false;
}

async function handleQueuedSubscriptionUpdates(userId: string, queueData: any) {
	if (!queueData) return;

	const updateDate = new Date(queueData.updatePlanDate);
	const currDate = new Date(getPaypalFormatDate());
	console.log(updateDate, currDate, updateDate <= currDate,"updateDate <= currDate");
	if (updateDate <= currDate) {
		await performPlatformAccessChange(queueData.type, queueData.subscriptionId, String(userId));
		await updateSubscriptionQueue.deleteOne({ _id: queueData._id });
		return {
			success: true,
			status: 202,
			message: 'Your Subscription is Paused Successfully',
		};
	}
}

export async function handleUserPaidAndPersonalInfo(req: Request, res: Response) {
	try {
		const { clerkUserId } = req.body;
		if (!clerkUserId) {
			return res.status(400).json({ success: false, message: 'Please provide clerkUserId' });
		}

		// Check Redis cache
		const cachedData = await getRedisData(`USER-PAYMENT-${clerkUserId}`);
		if (cachedData.success) {
			return res.status(200).json({ success: true, data: JSON.parse(cachedData.data) });
		}

		await connectDB();

		const user = await User.findOne({ clerkUserId });
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		// Handle queued subscription updates
		const queueData = await updateSubscriptionQueue.findOne({ userId: user._id });
		const queueResponse = await handleQueuedSubscriptionUpdates(String(user._id), queueData);
		if (queueResponse) return res.status(queueResponse.status).json(queueResponse);

		const paidUser = await UserPayment.findOne({ userId: user._id });
		if (!paidUser) {
			return res.status(404).json({ success: false, message: 'User payment not found' });
		}

		// Pause subscription if overdue
		if (paidUser.activePlan) {
			const paused = await pauseSubscriptionIfOverdue(String(user._id), String(paidUser.activePlan));
			if (paused) {
				return res.status(200).json({ success: true, message: 'Subscription paused due to overdue payment.' });
			}
		}

		const responseData = {
			id: user._id,
			clerkUserId: user.clerkUserId,
			planAccess: paidUser.planAccess,
			activePlan: paidUser.activePlan,
		};

		// Cache the response
		await setRedisData(`USER-PAYMENT-${clerkUserId}`, JSON.stringify(responseData), 60 * 60 * 24);

		return res.status(200).json({ success: true, data: responseData });
	} catch (error: any) {
		console.error(`Error in handleUserPaidAndPersonalInfo: ${error.message}`);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
}

async function performPlatformAccessChange(operationType: string, subscriptionId: string, userId: string) {
	const queueData = await updateSubscriptionQueue.findOne({ userId, subscriptionId });
	if (!queueData) return {
		success: false,
		status: 404,
		message: 'Subscription update failed',
	}
	if (queueData.type !== operationType) return {
		success: false,
		status: 404,
		message: 'Subscription update failed',
	}

	const idx = queueData.updatePlanAccessTo;
	let newPlanAccess = [false, false, false];
	newPlanAccess[idx] = true;


	const newUserPlan = await UserPayment.findOneAndUpdate(
		{ userId },
		{ activePlan: operationType == "downgrade" || operationType == "resume" ? subscriptionId : "", planAccess: newPlanAccess },
		{ new: true }
	)

	if (!newUserPlan) return {
		success: false,
		status: 500,
		message: 'Internal Server Error',
	}

	const previousLog = await userPaymentLogs.findOne({
		userId,
		subscriptionId,
		status: { $in: ["Subscription ACTIVE", "ACTIVE"] },
	});
	if (!previousLog) return {
		success: false,
		status: 404,
		message: 'Subscription update failed',
	}

	const newLog = {
		userId,
		subscriptionId,
		status: `Platform Access Changed to ${newPlanAccess[1] ? "Standard" : newPlanAccess[2] ? "Premium" : "Basic"} Plan. Subscription ${operationType.toUpperCase()}`,
		baseBillingPlanId: previousLog.baseBillingPlanId,
		planName: previousLog.planName,
		isCouponApplied: previousLog.isCouponApplied,
		couponCode: previousLog.couponCode,
	}

	await userPaymentLogs.create(newLog);
	return {
		success: true,
		status: 200,
		message: 'Subscription updated successfully',
	}
}
