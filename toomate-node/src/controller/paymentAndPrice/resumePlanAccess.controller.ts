import connectDB from '../../db/db.db.js';
import getPaypalAccessToken from '../../utils/paypalUtils.js';
import axios from 'axios';
import { Request, Response } from 'express';

async function getSubscriptionData(subscriptionId: string) {
	const accessToken = await getPaypalAccessToken();
	const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;
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
		return { success: true, data: response.data };
	} catch (error: any) {
		return {
			success: false,
			data: `Error fetching subscription details: ${error.response?.data || error.message}`,
		};
	}
}

export async function resumePlanAccess(req: Request, res: Response) {
	await connectDB();
	try {
		const { userId, subscriptionId } = req.body;

		if (!userId || !subscriptionId) {
			return res
				.status(400)
				.json({ message: 'User ID and Subscription ID are required' });
		}

		const data = await getSubscriptionData(subscriptionId);
		if (!data.success || data.data.status !== 'ACTIVE') {
			return res.status(404).json({
				message: 'Subscription not found',
				success: false,
				status: 404,
			});
		}

		const updateSubscriptionPlan =
			await updateTheSubscriptionPlan(subscriptionId);
		if (!updateSubscriptionPlan.success) {
			return res.status(500).json({
				message: 'Error updating subscription plan',
				success: false,
				status: 500,
			});
		}

		return res.status(200).json({
			message: 'Subscription plan updated successfully',
			success: true,
			status: 200,
			data: updateSubscriptionPlan.data,
		});
	} catch (error) {
		console.error(error);

		res.status(500).send('Internal Server Error');
	}
}

async function updateTheSubscriptionPlan(subscriptionId: string) {
	const accessToken = await getPaypalAccessToken();
	const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;
	try {
		const response = await axios.post(
			`${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}/activate`,
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
		return { success: true, data: response.data || null };
	} catch (error: any) {
		console.error('Error updating subscription plan:', error.message);
		return { success: false, data: null };
	}
}
