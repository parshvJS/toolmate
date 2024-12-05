import connectDB from '@/db/db.db';
import updateSubscriptionQueue from '@/models/updateSubscriptionQueue.model';
import { UserPayment } from '@/models/userPayment.model';
import { Request, Response } from 'express';
export async function downGradeSubscription(req: Request, res: Response) {
    await connectDB();
    try {
        const { userId, subscriptionId } = req.body;

        if (!userId || !subscriptionId) {
            return res.status(400).json({ message: "User ID and Subscription ID are required" });
        }
        const updateQueue = await updateSubscriptionQueue.findOne({ subscriptionId: subscriptionId, userId: userId });

        if (!updateQueue && updateQueue.) {
            return res.status(404).json({ message: "No payment logs found." });
        }

        const updatePlanAccessTo = updateQueue.updatePlanAccessTo;

        if (updatePlanAccessTo !== 0 && updatePlanAccessTo !== 1 && updatePlanAccessTo !== 2) {
            return res.status(400).json({ message: "Invalid updatePlanAccessTo value" });
        }

        const newPlanAccess = [false, false, false]
        newPlanAccess[updatePlanAccessTo] = true;

        const userPayment = await UserPayment.findOneAndUpdate({ userId: userId }, {
            $set: {
                planAccess: newPlanAccess
            }
        }, { new: true });

        if (!userPayment) {
            return res.status(404).json({ message: "No payment logs found." });
        }

        await updateSubscriptionQueue.deleteOne({ subscriptionId: subscriptionId, userId: userId });

        // change the log
        return res.status(200).json({ message: "Subscription downgraded successfully", data: userPayment });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}