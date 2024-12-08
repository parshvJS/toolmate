import connectDB from '../../db/db.db.js';
import User from '../../models/user.model.js';
import { UserPayment } from '../../models/userPayment.model.js';
import { Request, Response } from 'express';
import { getRedisData, setRedisData } from '../../services/redis.js';
import updateSubscriptionQueue from '../../models/updateSubscriptionQueue.model.js';
import axios from 'axios';
import getPaypalAccessToken, {
	getPaypalFormatDate,
} from '../../utils/paypalUtils.js';

export async function verifyCurrUserPayment(subscriptionId: string) {
	const accessToken = await getPaypalAccessToken();
	const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;
	const subDetails = await axios.get(
		`${BASE_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		}
	);

	if (!subDetails) {
		return false;
	}

	const currDate = new Date();
	const nextBillingCycleDate = new Date(
		subDetails.data.billing_info.next_billing_time
	);
	if (currDate > nextBillingCycleDate) {
		return false;
	}

	return true;
}

export async function handleUserPaidAndPersonalInfo(
	req: Request,
	res: Response
) {
	try {
		console.log('handleUserPaidAndPersonalInfo');
		const { clerkUserId } = req.body;
		if (!clerkUserId) {
			return res.status(400).json({
				success: false,
				status: 400,
				message: 'Please provide clerkUserId',
			});
		}

		// check the existing value in redis
		const redisData = await getRedisData(`USER-PAYMENT-${clerkUserId}`);
		if (redisData.success) {
			return res.status(200).json({
				success: true,
				status: 200,
				data: JSON.parse(redisData.data),
			});
		}

		await connectDB();
		// Retrieve user info
		const user = await User.findOne({ clerkUserId });
		if (!user) {
			return res.status(404).json({
				success: false,
				status: 404,
				message: 'User not found',
			});
		}

		const currDate = getPaypalFormatDate();
		const queueData = await updateSubscriptionQueue.findOne({
			userId: user._id,
		});
		if (queueData && queueData.updatePlanDate >= currDate) {
			await performPauseSubscription(
				queueData.type,
				queueData.subscriptionId,
				String(queueData.userId)
			);
		}
		// Retrieve payment info
		const paidUser = await UserPayment.findOne({ userId: user._id });
		if (!paidUser) {
			return res.status(404).json({
				success: false,
				status: 404,
				message: 'User payment not found',
			});
		}

		// set the data to redis
		await setRedisData(
			`USER-PAYMENT-${clerkUserId}`,
			JSON.stringify({
				id: user._id,
				clerkUserId: user.clerkUserId,
				planAccess: paidUser.planAccess,
			}),
			60 * 60 * 24
		);
		return res.status(200).json({
			success: true,
			status: 200,
			data: {
				id: user._id,
				clerkUserId: user.clerkUserId,
				planAccess: paidUser.planAccess,
			},
		});
	} catch (error: any) {
		return res.status(500).json({
			success: false,
			status: 500,
			message: error.message,
		});
	}
}

async function performPauseSubscription(
	operationType: string,
	subscriptionId: string,
	userId: string
) {
	switch (operationType) {
		case 'suspend':
			const suspendUrl = `${process.env.SERVER_URL}/api/v1/suspendSubscription`;
			const suspendResponse = await axios.post(suspendUrl, {
				subscriptionId,
				userId,
			});
			console.log(suspendResponse.data, 'pause subscription response');
			if (suspendResponse.status !== 200) {
				return {
					success: false,
					message: suspendResponse.data.message,
				};
			}
			return {
				success: true,
				message: 'Subscription suspended successfully',
			};
		case 'cancel':
			const cancelUrl = `${process.env.SERVER_URL}/api/v1/cancelSubscription`;
			const cancelResponse = await axios.post(cancelUrl, {
				subscriptionId,
				userId,
			});
			console.log(cancelResponse.data, 'cancel subscription response');
			if (cancelResponse.status !== 200) {
				return {
					success: false,
					message: cancelResponse.data.message,
				};
			}
			return {
				success: true,
				message: 'Subscription canceled successfully',
			};
		case 'downgrade':
			const downgradeUrl = `${process.env.SERVER_URL}/api/v1/downgradeSubscription`;
			const downgradeResponse = await axios.post(downgradeUrl, {
				subscriptionId,
				userId,
			});
			console.log(
				downgradeResponse.data,
				'downgrade subscription response'
			);
			if (downgradeResponse.status !== 200) {
				return {
					success: false,
					message: downgradeResponse.data.message,
				};
			}
			return {
				success: true,
				message: 'Subscription downgraded successfully',
			};
		default:
			console.log('Invalid operation type');
	}
}
