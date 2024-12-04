import axios from 'axios';
import connectDB from '../../db/db.db.js';
import { Request, Response } from 'express';
import getPaypalAccessToken from '@/utils/paypalUtils.js';
import { UserPayment } from '@/models/userPayment.model.js';
import updateSubscriptionQueue from '@/models/updateSubscriptionQueue.model.js';
// user can suspend their subscription

const accessToken = await getPaypalAccessToken();
const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;
async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const response = await axios.get(`${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, data: `Error fetching subscription details: ${error.response?.data || error.message}` };
  }

}


export async function requestSubscriptionPause(req: Request, res: Response) {
  await connectDB();
  try {
    const { userId, subscriptionId, message } = req.body;
    const userPayment = await UserPayment.findOne({
      userId: userId
    });
    if (!userPayment) {
      return res.status(404).json({ message: 'No payment logs found.' });
    }
    if (!userPayment.activePlan || !userPayment.activePlan !== subscriptionId) {
      return res.status(400).json({ message: " Subscription Id Doesn't Match Currently Active Plan " });
    }
    const subscriptionDetails = await getSubscriptionDetails(subscriptionId);
    if (!subscriptionDetails.success) {
      return res.status(400).json({ message: "Failed to retrieve subscription details.", error: subscriptionDetails.data });
    }

    const nextBillingDate = subscriptionDetails.data.billing_info.next_billing_time;
    if (!nextBillingDate) {
      return res.status(400).json({ message: "Failed to retrieve next billing date. Either It does Not Exist Or Plan Is Already Over" });
    }

    // get the updatePlanAccessTo
    const newQueueDocs = {
      userId: userId,
      updatePlanDate: new Date(nextBillingDate),
      type: message,
      updatePlanAccessTo:0,
      subscriptionId: subscriptionId
    };

    // save the request to the queue
    const newQueue = await updateSubscriptionQueue.create(newQueueDocs);
    if (!newQueue) {
      return res.status(400).json({ message: "Failed to save the request to the queue" });
    }
    return res.status(200).json({ message: "Request to suspend subscription has been saved to the queue" });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}