import { Request, Response } from 'express';
import dotenv from 'dotenv';
import paypal from 'paypal-rest-sdk';
import connectDB from '../../db/db.db.js';
import { PaymentPlan } from '../../models/admin/paymentPlan.model.js';
import { IPaymentPlan } from '../../types/types.js';
// import getPaypalAccessToken from '../../utils/getPaypalAccessToken.js';
import axios from 'axios';
import User from '../../models/user.model.js';
import { get } from 'mongoose';
import getPaypalAccessToken from '../../utils/paypalUtils.js';

dotenv.config();



export async function Payment(req: Request, res: Response) {
    await connectDB();
    console.log("Payment");
    try {
        const { productId, userId, isCouponCodeApplied, CouponCode } = req.body;
        if (!productId || !userId) {
            return res.status(400).json({ message: 'Product Id and User Id is required' });
        }
        if (isCouponCodeApplied) {
            if (!CouponCode) {
                return res.status(400).json({ message: 'Coupon Code is required' });
            }

            // code to modify the plan as per discount
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { email, firstName, lastName } = user;
        const paymentData = await PaymentPlan.findOne();
        if (!paymentData || !paymentData.essentialProductId || !paymentData.proProductId || paymentData.essentialProductId.length === 0 || paymentData.proProductId.length === 0) {
            return res.status(404).json({ message: 'No payment plans found' });
        }
        const isEssential = paymentData.essentialProductId.includes(productId) || false;
        const isPro = paymentData.proProductId.includes(productId);
        if (!isEssential && !isPro) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const paypalData = {
            plan_id: productId,
            subscriber: {
                name: {
                    given_name: firstName,
                    surname: lastName
                },
                email_address: email
            },
            application_context: {
                brand_name: 'Toomate AI Solutions',
                locale: 'en-AU',
                user_action: 'SUBSCRIBE_NOW',
                return_url: `${process.env.PAYPAL_SUCCESSS_REDIRECT_URL}?`,
                cancel_url: `${process.env.PAYPAL_CANCEL_REDIRECT_URL}`
            }
        }

        const url = `${process.env.PAYPAL_API_BASE_URL}/v1/billing/subscriptions`;
        const accessToken = await getPaypalAccessToken();
        const options = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        }
        console.log("paypalData", paypalData, "url", url, "options", options);
        const subscriptionData = await paypalApiRequest(url, paypalData, options);
        if (!subscriptionData) {
            return res.status(404).json({ message: 'No subscription data found' });
        }
        if (subscriptionData.status === 401 || subscriptionData.data.status === 401) {
            return res.status(401).json({ message: 'Unauthorized', data: subscriptionData.data });
        }
        const redirectionUrl = subscriptionData.data.links?.find((link: {
            rel: string;
        }) => link.rel === 'approve');

        return res.status(200).json({ url: redirectionUrl.href, message: 'Redirect to PayPal' });
    } catch (error: any) {
        console.log(error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


async function paypalApiRequest(url: string, data: any, options: any, retry = true) {
    let res;
    try {
        console.log("retry", retry);

        res = await axios.post(url, data, { headers: options });

        if (res.status === 401 && retry) {
            console.warn('401 Unauthorized. Regenerating access token...');
            await getPaypalAccessToken(true); // Fetch a new token
            return paypalApiRequest(url, data, options, false); // Retry the request
        }

        return res;
    } catch (error) {
        if (retry) {
            console.warn('401 Unauthorized. Regenerating access token...');
            await getPaypalAccessToken(true); // Fetch a new token
            return paypalApiRequest(url, data, options, false); // Retry the request
        }
        console.error('Error during PayPal API request:', error);
        throw error;
    }
}




