import { Request, Response } from 'express';
import dotenv from 'dotenv';
import paypal from 'paypal-rest-sdk';
import connectDB from '../db/db.connect.js';
import { PaymentPlan } from '../models/admin/paymentPlan.model.js';
import { IPaymentPlan } from '../types/types.js';

dotenv.config();

paypal.configure({
    'mode': 'sandbox', // sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID!,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET!
});

export async function Payment(req: Request, res: Response) {
    await connectDB();
    try {
        const { plan, duration, userId } = req.body;

        // Validate input
        if (!plan || !duration || !userId) {
            return res.status(400).json({ message: "Plan, duration, and user ID are required." });
        }

        // Retrieve price plans from database
        const pricePlans = await PaymentPlan.find();
        const pricePlan = pricePlans[0]; // Assuming there's at least one price plan
        const selectedPlanPrice = plan === "essential" ? pricePlan.essntialPrice : pricePlan.proPrice;
        const discount = duration === "sixMonth" ? pricePlan.discountOnSixMonth : (duration === "yearly" ? pricePlan.discountOnYearly : 0);
        const durationInt = duration === "sixMonth" ? 6 : (duration === "yearly" ? 12 : 1);
        const totalPrice = selectedPlanPrice * durationInt;
        const discountPrice = totalPrice - (totalPrice * discount / 100);

        // Create PayPal payment JSON
        
        const create_payment_json = {
            intent: 'sale',
            payer: {
            payment_method: 'paypal'
            },
            redirect_urls: {
            return_url: process.env.PAYPAL_SUCCESSS_REDIRECT_URL!,
            cancel_url: process.env.PAYPAL_CANCEL_REDIRECT_URL!
            },
            transactions: [{
            item_list: {
                items: [{
                name: `Service Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}`, // Service Name
                sku: '001', // Unique SKU for the service
                price: discountPrice.toFixed(2), // Final price after discount
                currency: 'USD',
                quantity: 1
                }]
            },
            amount: {
                currency: 'USD',
                total: discountPrice.toFixed(2), // Total price for the transaction
            },
            description: `Purchase of Toolmate ${plan} plan for ${duration === "sixMonth" ? "6(Six)" : (duration === "yearly" ? "12(Twelve)" : "1(One)")} (Duration: ${durationInt} month(s))`, // Description
            custom: JSON.stringify({ userId }) // Custom field for userId
            }]
        };

        // Create the payment
        paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.error(error);
                res.status(500).send(error);
            } else {
                if (payment.links === undefined) {
                    return res.status(500).json({ message: "An error occurred while processing the payment." });
                }
                for (let link of payment.links) {
                    if (link.rel === 'approval_url') {
                        // Redirect the user to PayPal for approval
                        res.json({ forwardLink: link.href });
                    }
                }
            }
        });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: "An error occurred while processing the payment." });
    }
}

