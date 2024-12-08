import { Request, Response } from 'express';
import dotenv from 'dotenv';
import paypal from 'paypal-rest-sdk';
import connectDB from '../../db/db.db.js';
import { PaymentPlan } from '../../models/admin/paymentPlan.model.js';
import axios from 'axios';
import User from '../../models/user.model.js';
import getPaypalAccessToken, { getPaypalFormatDate } from '../../utils/paypalUtils.js';
import PaymentSession from '../../models/paymentSession.model.js';
import CouponCode from '../../models/admin/couponCode.model.js';
import { UserPayment } from '../../models/userPayment.model.js';
import { calculateProrationPrice, getDays } from '../../utils/utilsFunction.js';

dotenv.config();

const accessToken = await getPaypalAccessToken();
async function getProductData(productId: string) {
  try {
    const response = await axios.get(
      `${process.env.PAYPAL_API_BASE_URL}/v1/billing/plans/${productId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(response.data, 'paypalInfo ----->');
    return response.data || null;
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
}

interface BillingCycle {
  frequency: {
    interval_unit: string;
    interval_count: number;
  };
  tenure_type: string;
  sequence: number;
  total_cycles: number;
  pricing_scheme: {
    fixed_price: {
      value: string;
      currency_code: string;
    };
  };
}
async function createBillingPlan(
  baseProductId: string,
  discountPercentage: number,
  firstBillingCycleOnly: boolean,
  isAbsoluteValueAsDiscount = false,
  absoluteValueDiscount = 0,
) {
  console.log('Creating billing plan with:', {
    baseProductId,
    discountPercentage,
    firstBillingCycleOnly,
  });
  let billingPlanData;
  billingPlanData = await getProductData(baseProductId);
  if (!billingPlanData) {
    console.error('No billing plan data retrieved.');
    return null;
  }

  // Find the REGULAR billing cycle with validation for nested properties
  const regularCycle = billingPlanData.billing_cycles.find(
    (cycle: BillingCycle) => cycle.tenure_type === 'REGULAR' && cycle.pricing_scheme?.fixed_price,
  );
  if (!regularCycle) {
    console.error('No REGULAR billing cycle with fixed price found.');
    return null;
  }


  // Function to calculate discounted price
  const calculatePrice = (price: number) => (price * (1 - discountPercentage / 100)).toFixed(2);

  // Define the new billing cycle
  console.log('Regular billing cycle:', JSON.stringify(regularCycle), "-=-=-=-=-=-=-=-", regularCycle.pricing_scheme.fixed_price.value);
  const billingCycle: BillingCycle = {
    frequency: regularCycle.frequency,
    tenure_type: 'REGULAR',
    sequence: firstBillingCycleOnly ? 2 : 1,
    total_cycles: 12,
    pricing_scheme: {
      fixed_price: {
        value: firstBillingCycleOnly
          ? regularCycle.pricing_scheme.fixed_price.value
          : calculatePrice(parseFloat(regularCycle.pricing_scheme.fixed_price.value)),
        currency_code: 'USD',
      },
    },
  };
  billingPlanData.billing_cycles = [billingCycle];

  // Add a discounted cycle if `firstBillingCycleOnly` is true
  if (firstBillingCycleOnly) {
    const discountedPrice =
      isAbsoluteValueAsDiscount ? String(absoluteValueDiscount) :
        calculatePrice(
          parseFloat(regularCycle.pricing_scheme.fixed_price.value),
        );
    console.log('Discounted price for first billing cycle:', discountedPrice);

    const addOnCycle: BillingCycle = {
      frequency: regularCycle.frequency,
      tenure_type: 'TRIAL',
      sequence: 1,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: {
          value: discountedPrice,
          currency_code: 'USD',
        },
      },
    };

    // Insert the discounted cycle at the start of `billing_cycles`
    billingPlanData.billing_cycles.unshift(addOnCycle);
    console.dir(billingPlanData, 'billingPlanData------------------------');
  }

  // Prepare the new billing plan request body
  const newPlanBody = {
    product_id: billingPlanData.product_id,
    name: billingPlanData.name,
    description: billingPlanData.description,
    billing_cycles: billingPlanData.billing_cycles,
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  // Create the new billing plan
  try {
    console.log('Creating new billing plan:', newPlanBody);
    const response = await axios.post(
      `${process.env.PAYPAL_API_BASE_URL}/v1/billing/plans`,
      newPlanBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('New billing plan created:', response.data);
    return response.data || null;
  } catch (error: any) {
    console.error('Error creating new billing plan:', error.message);
    return null;
  }
}

// this function check the current subscription of user
async function checkSubscriptionOfUser(userId: string) {
  const userPaymentLog = await UserPayment.findOne({
    userId,
  });
  if (!userPaymentLog) {
    return {
      success: false,
      isSubscribed: false,
      message: 'payment log not fount',
    };
  }
  const activePlan = userPaymentLog?.activePlan;
  if (!activePlan) {
    return {
      success: false,
      isSubscribed: false,
      message: 'No Active Plan',
    };
  }

  // get the paypal subscription data
  const accessToken = await getPaypalAccessToken();
  const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;
  const url = `${BASE_API_URL}/v1/billing/subscriptions/${activePlan}`;
  const paypalSubscription = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (paypalSubscription.status !== 200) {
    return {
      success: false,
      isSubscribed: false,
      message: 'No Active Plan',
    };
  }

  const nextBillingDate = paypalSubscription.data.billing_info.next_billing_time;
  const currentDate = getPaypalFormatDate();
  if (nextBillingDate < currentDate) {
    return {
      success: false,
      isSubscribed: false,
      message: 'No Active Plan',
    };
  }
  const subscriptionData = paypalSubscription.data.status == 'ACTIVE' ? true : false;
  return {
    success: true,
    isSubscribed: subscriptionData,
    subscriptionId: activePlan,
    message: 'User data found',
    data: paypalSubscription.data
  };
}
// to use this function for update plan 
// productId:required, planName:required, userId:required, isCouponCodeApplied:true, CouponCode:null 
export async function Payment(req: Request, res: Response) {
  await connectDB();
  console.log('Payment');

  try {
    const { productId, planName, userId, isCouponCodeApplied, CouponCode: couponInput } = req.body;
    if (!productId || !userId) {
      return res.status(400).json({ message: 'Product Id and User Id are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const { email, firstName, lastName } = user;
    const paymentData = await PaymentPlan.findOne();
    if (!paymentData?.essentialProductId?.length || !paymentData.proProductId?.length) {
      return res.status(404).json({ message: 'No payment plans found' });
    }

    const isEssential = paymentData.essentialProductId.includes(productId);
    const isPro = paymentData.proProductId.includes(productId);
    if (!isEssential && !isPro) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let finalProductId = productId;
    let baseProductId: string | null = null;
    let couponCodeId: string | null = null;

    if (isCouponCodeApplied) {
      if (!couponInput) {
        return res.status(400).json({ message: 'Coupon Code is required' });
      }

      const currentDate = Date.now();
      const coupon = await CouponCode.findOne({
        code: couponInput,
        isActive: true,
        expiryDate: { $gte: currentDate },
        limit: { $gt: 0 },
      });

      if (!coupon) {
        return res.status(404).json({ message: 'Coupon Code not found' });
      }


      const newBillingPlan = await createBillingPlan(
        productId,
        coupon.discountPercentage,
        coupon.firstBillingCycleOnly,
        false,
        0,
      );
      console.log(newBillingPlan, 'newBillingPlan');
      if (!newBillingPlan) {
        return res.status(404).json({ message: 'No billing plan found' });
      }

      finalProductId = newBillingPlan.id;
      baseProductId = productId;
      couponCodeId = String(coupon._id);
    }

    // check if user have existing subscription
    const isUserAlreadySubscribed = await checkSubscriptionOfUser(userId);
    console.log(isUserAlreadySubscribed, 'isUserAlreadySubscribed');
    if (isUserAlreadySubscribed.isSubscribed && isCouponCodeApplied) {
      return res.status(400).json({ message: 'Coupons no allowed for the exiting plan' });
    }

    if (isUserAlreadySubscribed.success && isUserAlreadySubscribed.isSubscribed) {

      const paypalDetails = isUserAlreadySubscribed.data;
      if (!paypalDetails) {
        return res.status(404).json({ message: 'No subscription data found' });
      }

      const ACCESS_CODE = await getPaypalAccessToken();
      const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;
      const url = `${BASE_API_URL}/v1/billing/plans/${productId}`;
      const newPlanUserWantToSubscribe = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${ACCESS_CODE}`,
          'Content-Type': 'application/json',
        },
      });
      if (newPlanUserWantToSubscribe.status !== 200) {
        return res.status(404).json({ message: 'No subscription data found' });
      }

      const exitingPrice = paypalDetails.billing_info.last_payment.amount.value;
      const regularPriceSchema = newPlanUserWantToSubscribe.data.billing_cycles.find(
        (cycle: any) => cycle.tenure_type === 'REGULAR' && cycle.pricing_scheme?.fixed_price,
      );
      const newPrice = regularPriceSchema.pricing_scheme.fixed_price.value;
      const regularOldCycle = paypalDetails.billing_cycle.find(
        (cycle: any) => cycle.tenure_type === 'REGULAR' && cycle.pricing_scheme?.fixed_price,
      );
      const durationPrefix = paypalDetails.billing_cycle[paypalDetails.billing_cycle.length - 1].frequency.interval_unit;
      const duration = paypalDetails.billing_cycle[paypalDetails.billing_cycle.length - 1].frequency.interval_unit;



      const nextBillingDate = paypalDetails.billing_info.next_billing_time;
      const currentDate = getPaypalFormatDate();
      const daysRemaining = Math.ceil((new Date(nextBillingDate).getTime() - new Date(currentDate).getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = getDays(durationPrefix, duration);
      const prorationPrice = calculateProrationPrice(exitingPrice, newPrice, daysRemaining, totalDays);

      const newBillingPlan = await createBillingPlan(
        productId,
        0,
        true,
        true,
        prorationPrice,
      );
      console.log(newBillingPlan, 'newBillingPlan');
      if (!newBillingPlan) {
        return res.status(404).json({ message: 'No billing plan found' });
      }

      finalProductId = newBillingPlan.id;
      baseProductId = productId;
    }

    const paypalData = {
      plan_id: finalProductId,
      subscriber: {
        name: { given_name: firstName, surname: lastName },
        email_address: email,
      },
      application_context: {
        brand_name: 'Toomate AI Solutions',
        locale: 'en-AU',
        user_action: 'SUBSCRIBE_NOW',
        return_url: process.env.PAYPAL_SUCCESSS_REDIRECT_URL,
        cancel_url: process.env.PAYPAL_CANCEL_REDIRECT_URL,
      },
    };

    const subscription = await paypalApiRequest(
      `${process.env.PAYPAL_API_BASE_URL}/v1/billing/subscriptions`,
      paypalData,
      {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    );

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription data found' });
    }

    if (subscription.status === 401 || subscription.data.status === 401) {
      return res.status(401).json({ message: 'Unauthorized', data: subscription.data });
    }

    const approvalLink = subscription.data.links?.find((link: any) => link.rel === 'approve');
    const baToken = approvalLink ? new URL(approvalLink.href).searchParams.get('ba_token') : null;

    if (!baToken) {
      return res.status(400).json({ message: 'ba_token not found' });
    }

    const planAccess = isEssential ? 1 : isPro ? 2 : 0;

    const paypalSession = {
      ba: baToken,
      planName,
      planAcccesToBeGranted: planAccess,
      baseBillingPlanId: baseProductId,
      couponCodeId,
    };

    const newSession = await PaymentSession.create(paypalSession);
    if (!newSession) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    return res.status(200).json({ url: approvalLink.href, message: 'Redirect to PayPal' });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

async function paypalApiRequest(url: string, data: any, headers: any, retry = true) {
  try {
    const response = await axios.post(url, data, { headers });
    return response;
  } catch (error: any) {
    if (error.response?.status === 401 && retry) {
      console.warn('401 Unauthorized. Regenerating access token...');
      await getPaypalAccessToken();
      return paypalApiRequest(url, data, headers, false);
    }
    console.error('PayPal API request error:', error.message);
    throw error;
  }
}
