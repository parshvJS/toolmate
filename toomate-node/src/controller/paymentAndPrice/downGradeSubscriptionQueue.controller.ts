import connectDB from '../../db/db.db.js';
import { Request, Response } from 'express';
export async function downGradeSubscriptionQueue(req: Request, res: Response) {
    await connectDB()
    try {
        const { newSubscriptionId, }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}