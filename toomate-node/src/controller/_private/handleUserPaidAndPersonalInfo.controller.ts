import connectDB from "../../db/db.connect.js";
import User from "../../models/user.model.js";
import { UserPayment } from "../../models/userPayment.model.js";
import { Request, Response } from "express";

export async function handleUserPaidAndPersonalInfo(req: Request, res: Response) {
    try {
        await connectDB();
        const data = req.body;

        if (!data.clerkUserId) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Please provide clerkUserId"
            });
        }

        const user = await User.findOne({ clerkUserId: data.clerkUserId });

        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found"
            });
        }

        const paidUser = await UserPayment.findOne({ userId: user._id });

        if (!paidUser) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User payment not found"
            });
        }
        console.log("User Paid and Personal Info fetched successfully!");
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
