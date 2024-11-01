import connectDB from "../../db/db.db.js";
import User from "../../models/user.model.js";
import UserToolInventory from "../../models/userToolInventory.model.js";
import { Request, Response } from "express";

// this function will add a tool to user's tool inventory
export async function addToUsertoolInventory(req: Request, res: Response) {
    await connectDB();

    try {
        const { userId, toolName, toolDescription, toolCount, tags } = req.body;
        if (!userId || !toolName || !toolDescription || !tags) {
            return res.status(400).json({
                success: false,
                message: "userId,toolName,toolDescription,toolCount are required"
            })
        }

        const seperatedTags = tags.split(",");

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }


        const newToolInventory = new UserToolInventory({
            userId,
            name: toolName,
            description: toolDescription,
            count: toolCount,
            tags: seperatedTags
        });

        const savedToolInventory = await newToolInventory.save();
        if (!savedToolInventory) {
            return res.status(500).json({
                success: false,
                message: "Failed to add tool to user inventory"
            })
        }
        if (user.toolInventory) {
            user.toolInventory.push(savedToolInventory._id);
        }
        else {
            user.toolInventory = [savedToolInventory._id];
        }
        const savedUser = await user.save();
        if (!savedUser) {
            return res.status(500).json({
                success: false,
                message: "Failed to add tool to user inventory"
            })
        }
        const responseData = {
            name: savedToolInventory.name,
            description: savedToolInventory.description,
            count: savedToolInventory.count,
            tags: savedToolInventory.tags,
            _id: savedToolInventory._id
        }
        return res.status(200).json({
            success: true,
            message: "Tool added to user inventory",
            data: responseData
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}