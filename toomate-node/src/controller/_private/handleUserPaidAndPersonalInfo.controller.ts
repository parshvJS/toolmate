import connectDB from "../../db/db.db.js";
import User from "../../models/user.model.js";
import { UserPayment } from "../../models/userPayment.model.js";
import { Request, Response } from "express";
import { getRedisData, setRedisData } from "../../services/redis.js";
import updateSubscriptionQueue from "../../models/updateSubscriptionQueue.model.js";
import axios from "axios";
import getPaypalAccessToken from "@/utils/paypalUtils.js";

export async function verifyCurrUserPayment(subscriptionId:string){
    const accessToken  = await getPaypalAccessToken();
    const BASE_API_URL = process.env.PAYPAL_API_BASE_URL;
    const subDetails = await axios.get(`${BASE_API_URL}/v1/billing/subscriptions/${subscriptionId}`,{
        headers:{
            Authorization:`Bearer ${accessToken}`,
            "Content-Type": "application/json",
        }
    })

    if(!subDetails){
        return false
    }

    const currDate = new Date();
    const nextBillingCycleDate = new Date(subDetails.data.billing_info.next_billing_time);
    if(currDate > nextBillingCycleDate){
        return false
    }

    return true
}

export async function handleUserPaidAndPersonalInfo(req: Request, res: Response) {
    try {
        console.log("handleUserPaidAndPersonalInfo");
        const { clerkUserId } = req.body;
        if (!clerkUserId) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Please provide clerkUserId"
            });
        }

        // check the existing value in redis
        const redisData = await getRedisData(`USER-PAYMENT-${clerkUserId}`);
        if (redisData.success) {
            return res.status(200).json({
                success: true,
                status: 200,
                data: JSON.parse(redisData.data)
            });
        }

        await connectDB();
        // Retrieve user info
        const user = await User.findOne({ clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found"
            });
        }

        // check the queue for pause request
        // TODO: change the format
        const currDate = new Date()
        const queueData = await updateSubscriptionQueue.findOne({ userId: user._id });
        if (queueData) {

        }



        // Retrieve payment info
        const paidUser = await UserPayment.findOne({ userId: user._id });
        if (!paidUser) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User payment not found"
            });
        }

        // check the payment of curr User 
        // TODO:

        // set the data to redis
        await setRedisData(`USER-PAYMENT-${clerkUserId}`, JSON.stringify({
            id: user._id,
            clerkUserId: user.clerkUserId,
            planAccess: paidUser.planAccess
        }), 60 * 60 * 24);
        return res.status(200).json({
            success: true,
            status: 200,
            data: {
                id: user._id,
                clerkUserId: user.clerkUserId,
                planAccess: paidUser.planAccess
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
}



