import connectDB from '../../db/db.db.js';
import { UserPayment } from '../../models/userPayment.model.js';
import userPaymentLogs from '../../models/userPaymentLogs.model.js';
import getPaypalAccessToken from '../../utils/paypalUtils.js';
import axios from 'axios';
import { Request, Response } from 'express';

async function cancelPaypalSubscription(
	subscriptionId: string,
	accessToken: string
) {
	const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;
	await axios.post(
		`${BASE_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
		{
			reason: 'Requested by customer',
		},
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		}
	);

	const { data } = await axios.get(
		`${BASE_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		}
	);

	return data;
}

async function logCancellation(subscriptionId: string, status: string) {
	const subscriptionData = await userPaymentLogs.findOne({ subscriptionId });
	if (!subscriptionData) {
		throw new Error('Subscription not found');
	}

	const newLog = {
		userId: subscriptionData.userId,
		subscriptionId,
		isCouponApplied: subscriptionData.isCouponApplied,
		couponCode: subscriptionData.couponCode,
		status,
		baseBillingPlanId: subscriptionData.baseBillingPlanId,
		planName: subscriptionData.planName,
	};

	const logNew = await userPaymentLogs.create(newLog);
	return logNew;
}

async function changeThePlatformAccess(userId: string) {
	const userPayment = await UserPayment.findOne({ userId });
	if (!userPayment) {
		return {
			success: false,
			message: 'User not found',
		};
	}
	const defaultAccess = [true, false, false];
	userPayment.planAccess = defaultAccess;
	const newUserPayment = await userPayment.save();
	if (!newUserPayment) {
		return {
			success: false,
			message: 'Failed to change the platform access',
		};
	}
	return {
		success: true,
		message: 'Platform access changed successfully',
	};

	// Function to change the platform access
}
export async function cancelSubscription(req: Request, res: Response) {
	await connectDB();

	const { subscriptionId, userId } = req.body;
	if (!subscriptionId) {
		return res
			.status(400)
			.json({ message: 'Subscription ID is required.' });
	}

	try {
		const accessToken = await getPaypalAccessToken();
		const paypalData = await cancelPaypalSubscription(
			subscriptionId,
			accessToken
		);
		const changeAccess = await changeThePlatformAccess(userId);
		if (!changeAccess.success) {
			return res.status(400).json({ message: changeAccess.message });
		}
		const updateLog = await logCancellation(
			subscriptionId,
			paypalData.status
		);

		return res.status(200).json({
			message: 'Subscription canceled successfully',
			data: updateLog,
		});
	} catch (error: any) {
		console.error(error);
		if (error.message === 'Subscription not found') {
			return res.status(404).json({ message: error.message });
		}
		return res.status(500).send('Internal Server Error');
	}
}
