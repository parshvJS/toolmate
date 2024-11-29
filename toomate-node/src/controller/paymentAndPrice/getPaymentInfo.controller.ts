import axios from "axios";
import { Request, Response } from "express";

export async function getPaymentInfo(req: Request, res: Response) {
    try {
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ message: "Subscription Id is required" });
        }

        const paypalInfo = await axios.get(`${process.env.PAYPAL_API_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`)
        console.log(paypalInfo.data, "paypalInfo ----->");
        if (paypalInfo.data) {

        }
    } catch (error: any) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal Server Error" });

    }
}