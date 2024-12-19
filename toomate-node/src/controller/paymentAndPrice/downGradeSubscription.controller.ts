import axios from 'axios';
import connectDB from '../../db/db.db.js';
import updateSubscriptionQueue from '../../models/updateSubscriptionQueue.model.js';
import { UserPayment } from '../../models/userPayment.model.js';
import userPaymentLogs from '../../models/userPaymentLogs.model.js';
import { Request, Response } from 'express';
import getPaypalAccessToken from '../../utils/paypalUtils.js';
import { PaymentPlan } from '../../models/admin/paymentPlan.model.js';
async function updateCurrentSubscription(subscriptionId: string, userId: string, durationIndex: number) {
  const ACCESS_TOKEN = await getPaypalAccessToken();
  const BASE_PAYPAL_URL = process.env.PAYPAL_API_BASE_URL;

  try {
    // Fetch subscription details
    const response = await axios.get(`${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.data) {
      return { success: false, data: 'Error fetching subscription details' };
    }

    const planId = response.data.plan_id;

    // Fetch payment plans from the database
    const paymentPlans = await PaymentPlan.findOne();
    if (!paymentPlans || !paymentPlans.essentialProductId || !paymentPlans.proProductId) {
      return { success: false, data: 'No payment plans found' };
    }

    const isEssential = paymentPlans.essentialProductId?.includes(planId);
    const isPro = paymentPlans.proProductId?.includes(planId);

    if (!isEssential && !isPro) {
      return { success: false, data: 'Invalid plan ID' };
    }

    // Determine the plan to update
    const planToUpdate = isPro
      ? paymentPlans.proProductId[durationIndex]
      : paymentPlans.essentialProductId[durationIndex];

    // Fetch plan details
    const planDetails = await axios.get(`${BASE_PAYPAL_URL}/v1/billing/plans/${planToUpdate}`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!planDetails.data) {
      return { success: false, data: 'Error fetching plan details' };
    }

    // Get new price and currency
    const billingCycle = planDetails.data.billing_cycles.find((cycle: any) => cycle.tenure_type === "REGULAR");
    if (!billingCycle || !billingCycle.pricing_scheme) {
      return { success: false, data: 'Error fetching price details' };
    }

    const newPrice = billingCycle.pricing_scheme.fixed_price.value;
    const newCurrency = billingCycle.pricing_scheme.fixed_price.currency_code;
    const sequence = response.data.billing_info.cycles_remaining.find((cycle: any) => cycle.tenure_type === "REGULAR").sequence;
    // Prepare data for the update API
    const dataGram = [
      {
        "op": "replace",
        "path": `/plan/billing_cycles/@sequence==${sequence}/pricing_scheme/fixed_price`,
        "value": {
          "currency_code": newCurrency,
          "value": newPrice
        }
      },
    ];

    // Update the subscription using PayPal's Update Subscription API
    const updateResponse = await axios.patch(
      `${BASE_PAYPAL_URL}/v1/billing/subscriptions/${subscriptionId}`,
      dataGram,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json-patch+json',
        },
      }
    );

    if (updateResponse.status === 204) { // PayPal returns 204 No Content on success
      return { success: true, data: 'Subscription updated successfully' };
    } else {
      return { success: false, data: 'Failed to update subscription' };
    }
  } catch (error: any) {
    return { success: false, data: `Error updating subscription: ${error.message}` };
  }
}

export async function downGradeSubscription(req: Request, res: Response) {
  await connectDB();
  try {
    const { userId, subscriptionId } = req.body;

    if (!userId || !subscriptionId) {
      return res.status(400).json({ message: 'User ID and Subscription ID are required' });
    }
    const updateQueue = await updateSubscriptionQueue.findOne({
      subscriptionId: subscriptionId,
      userId: userId,
    });

    if (!updateQueue || !updateQueue.updatePlanAccessTo) {
      return res.status(404).json({ message: 'No payment logs found.' });
    }
    const paypalSubUpdate = await updateCurrentSubscription(subscriptionId, userId, updateQueue.downgradePlanIndex);
    if (!paypalSubUpdate.success) {
      return res.status(500).json({ message: paypalSubUpdate.data });
    }
    const updatePlanAccessTo = updateQueue.updatePlanAccessTo;

    if (updatePlanAccessTo !== 0 && updatePlanAccessTo !== 1 && updatePlanAccessTo !== 2) {
      return res.status(400).json({ message: 'Invalid updatePlanAccessTo value' });
    }

    const newPlanAccess = [false, false, false];
    newPlanAccess[updatePlanAccessTo] = true;

    const userPayment = await UserPayment.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          planAccess: newPlanAccess,
        },
      },
      { new: true },
    );

    if (!userPayment) {
      return res.status(404).json({ message: 'No payment logs found.' });
    }

    // create log
    const logData = await userPaymentLogs.findOne({
      userId: userId,
      subscriptionId: subscriptionId,
    });
    if (!logData) {
      return res.status(404).json({ message: 'No payment logs found.' });
    }

    const newLog = {
      userId: userId,
      subscriptionId: subscriptionId,
      isCouponApplied: logData.isCouponApplied,
      couponCode: logData.couponCode,
      baseBillingPlanId: logData.baseBillingPlanId,
      planName: logData.planName,
      status: 'downgraded Successfully',
    };
    const [newLogData, subscription] = await Promise.all([
      updateSubscriptionQueue.deleteOne({
        subscriptionId: subscriptionId,
        userId: userId,
      }),
      userPaymentLogs.create(newLog),
    ]);

    if (!newLogData || !subscription) {
      return res.status(500).json({
        message: 'Problem in downgrading the subscription. Please try again later.',
      });
    }

    // change the log
    return res.status(200).json({
      message: 'Subscription downgraded successfully',
      data: userPayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
