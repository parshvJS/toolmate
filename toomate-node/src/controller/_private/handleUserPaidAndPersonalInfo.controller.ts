import connectDB from "../../db/db.connect.js";
import User from "../../models/user.model.js";
import { UserPayment } from "../../models/userPayment.model.js";
import { Request, Response } from "express";
import CryptoJS from "crypto-js";

// Helper function to generate encrypted data with an expiry
interface TokenData {
    data: string;
    expiry: Date;
}

const encryptWithExpiry = (data: any, secretKey: string, expiryInDays: number): TokenData => {
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryInDays);
    const token: TokenData = {
        data: encryptedData,
        expiry: expiryDate,
    };
    return token;
};

export async function handleUserPaidAndPersonalInfo(req: Request, res: Response) {
    try {
        await connectDB();
        const { clerkUserId, currentDate } = req.body;

        console.log("handleUserPaidAndPersonalInfo called", clerkUserId, currentDate);
        if (!clerkUserId) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Please provide clerkUserId"
            });
        }

        // Retrieve user info
        const user = await User.findOne({ clerkUserId });
        console.log("User fetched successfully!", user);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found"
            });
        }

        // Retrieve payment info
        const paidUser = await UserPayment.findOne({ userId: user._id });
        console.log("User Paid fetched successfully!", paidUser);
        if (!paidUser) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User payment not found"
            });
        }

        // Encrypt the planAccess array
        const secretKey = process.env.PAYMENT_SECURE_KEY || 'defaultSecretKey';
        const encryptedPlanAccess = CryptoJS.AES.encrypt(JSON.stringify(paidUser.planAccess), secretKey).toString();

        // Encrypt token with expiry (1 day)
        const tokenData = {
            userId: user._id,
            planAccess: paidUser.planAccess,
            clerkUserId: user.clerkUserId
        };
        const encryptedToken = encryptWithExpiry(tokenData, secretKey, 1); // Token expires in 1 day

        // Send response with encrypted plan access and encrypted token
        console.log("User Paid and Personal Info fetched successfully with encryption!", paidUser, user,{
            id: user._id,
            clerkUserId: user.clerkUserId,
            encryptedPlanAccess: encryptedPlanAccess,
            encryptedToken: encryptedToken
        });
        return res.status(200).json({
            success: true,
            status: 200,
            data: {
                id: user._id,
                clerkUserId: user.clerkUserId,
                encryptedPlanAccess: encryptedPlanAccess,
                encryptedToken: encryptedToken
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
