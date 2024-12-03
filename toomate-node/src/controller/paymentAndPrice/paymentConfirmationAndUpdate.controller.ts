import { Request, Response } from "express";
import userPaymentLogs from "../../models/userPaymentLogs.model.js";
import connectDB from "../../db/db.db.js";
import User from '../../models/user.model.js';
import PaymentSession from "../../models/paymentSession.model.js";
import { UserPayment } from "../../models/userPayment.model.js";

// Grants access to the user after payment confirmation
export async function paymentConfirmationAndUpdate(req: Request, res: Response) {
    await connectDB();

    try {
        const { subscriptionId, planName, ba, userId } = req.body;

        if (!subscriptionId || !userId) {
            return res.status(400).json({ message: "Subscription Id and User Id are required" });
        }

        const [user, paymentSession] = await Promise.all([
            User.findById(userId),
            PaymentSession.findOne({ ba })
        ]);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!paymentSession) {
            return res.status(404).json({ message: "Payment Session not found" });
        }

        const newLogData: any = {
            subscriptionId,
            userId: user._id,
            isCouponApplied: !!paymentSession.couponCodeId,
            couponCode: paymentSession.couponCodeId ? String(paymentSession.couponCodeId) : "",
            baseBillingPlanId: paymentSession.baseBillingPlanId || "",
            planName
        };

        const newLog = await userPaymentLogs.create(newLogData);
        if (!newLog) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        const planAccessToBeGranted = paymentSession.planAcccesToBeGranted;
        let userPaymentAccess = await UserPayment.findOne({ userId });

        if (!userPaymentAccess) {
            const planAccess = [false, false, false];
            if (planAccessToBeGranted >= 0 && planAccessToBeGranted < planAccess.length) {
                planAccess[planAccessToBeGranted] = true;
            }
            userPaymentAccess = await UserPayment.create({
                userId,
                activePlan: subscriptionId,
                planAccess
            });
            if (!userPaymentAccess) {
                return res.status(500).json({ message: "Internal Server Error" });
            }
        } else {
            if (planAccessToBeGranted >= 0 && planAccessToBeGranted < userPaymentAccess.planAccess.length) {
                userPaymentAccess.planAccess = [false,false,false]
                userPaymentAccess.planAccess[planAccessToBeGranted] = true;
            }
            userPaymentAccess.activePlan = subscriptionId;
            const updatedUserPaymentAccess = await userPaymentAccess.save();
            if (!updatedUserPaymentAccess) {
                return res.status(500).json({ message: "Internal Server Error" });
            }
        }

        return res.status(200).json({ message: "Payment Confirmed" });
    } catch (error: any) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


