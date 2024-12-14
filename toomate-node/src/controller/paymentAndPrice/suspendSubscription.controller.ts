import updateSubscriptionQueue from '../../models/updateSubscriptionQueue.model.js';
import connectDB from '../../db/db.db.js';
import { UserPayment } from '../../models/userPayment.model.js';
import userPaymentLogs from '../../models/userPaymentLogs.model.js';
import getPaypalAccessToken from '../../utils/paypalUtils.js';
import axios from 'axios';
import { Request, Response } from 'express';

async function suspendPaypalSubscription(subscriptionId: string, accessToken: string) {
  const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;
  await axios.post(`${BASE_API_URL}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
    reason: "Requested by customer"
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  const { data } = await axios.get(`${BASE_API_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  return data;
}

async function logSuspension(subscriptionId: string, status: string) {
  const subscriptionData = await userPaymentLogs.findOne({ subscriptionId });
  if (!subscriptionData) {
    throw new Error("Subscription not found");
  }

  const newLog = {
    userId: subscriptionData.userId,
    subscriptionId,
    isCouponApplied: subscriptionData.isCouponApplied,
    couponCode: subscriptionData.couponCode,
    status: `Subscription ${status}`,
    baseBillingPlanId: subscriptionData.baseBillingPlanId,
    planName: subscriptionData.planName,
  };

  const logNew = await userPaymentLogs.create(newLog);
  return logNew;
}

export async function suspendSubscription(req: Request, res: Response) {
  await connectDB();

  const { subscriptionId, userId } = req.body;
  if (!subscriptionId || !userId) {
    return res.status(400).json({ message: 'Subscription ID is required.' });
  }

  try {
    const accessToken = await getPaypalAccessToken();
    const paypalData = await suspendPaypalSubscription(subscriptionId, accessToken);
    const defaultAccess = [true, false, false];
    const paymentLog = await UserPayment.findOneAndUpdate({ userId }, {
      planAccess: defaultAccess,
      activePlan: "",
    }, { new: true });

    const updateQueue = await updateSubscriptionQueue.findOneAndDelete({
      subscriptionId,
      userId
    }, { new: true });

    if (!paymentLog) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (!updateQueue) {
      return res.status(404).json({ message: "Subscription update failed" });
    }

    await logSuspension(subscriptionId, paypalData.status);

    return res.status(200).json({ message: "Subscription suspended successfully" });
  } catch (error: any) {
    console.error(error);
    if (error.message === "Subscription not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).send('Internal Server Error');
  }
}

