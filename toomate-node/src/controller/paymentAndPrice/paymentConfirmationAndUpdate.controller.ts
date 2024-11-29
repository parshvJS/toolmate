import connectDB from "../../db/db.db.js";
import User from '../../models/user.model.js';
import { Request, Response } from "express";

export async function paymentConfirmationAndUpdate(req:Request,res:Response){
    await connectDB();
    try {
        const {subscriptionId,userId,isCouponCode,couponCode} = req.body;
        if(!subscriptionId || !userId){
            return res.status(400).json({message:"Subscription Id and User Id is required"});
        }

        if(isCouponCode){
            if(!couponCode){
                return res.status(400).json({message:"Coupon Code is required"});
            }

            // code for coupon code 
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }   
        
        
    } catch (error:any) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
        
    }
}