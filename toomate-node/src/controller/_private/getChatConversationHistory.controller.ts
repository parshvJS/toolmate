import { Document } from "mongoose";
import connectDB from "../../db/db.db.js";
import { Chat } from "../../models/chat.model.js";
import UserChat from "../../models/userChat.model.js";
import { Request, Response } from "express";
import Product from "../../models/adsense/product.model.js";
import { Community } from "../../models/community.model.js";

export async function getChatConversationHistory(req: Request, res: Response) {
    await connectDB();
    try {
        const { sessionId, userId, pagination } = req.body;

        if (!sessionId || !userId || !pagination) {
            return res.status(400).json({
                success: false,
                message: "Please Enter all the required fields [ sessionId, userId, pagination ]",
            });
        }
        console.log(sessionId, userId, pagination,"sessionId, userId, pagination");
        const userChatHistory = await UserChat.findOne({ sessionId }).lean();

        console.log(userChatHistory);
        if (!userChatHistory) {
            return res.status(404).json({
                success: false,
                message: "This Chat Is Not Found",
            });
        }

        if (String(userChatHistory.userId) !== userId) {
            return res.status(400).json({
                success: false,
                message: "You are not authorized to view this chat history",
            });
        }

        const { page = 1, limit = 10 } = pagination;

        // Fetch chat history
        console.log("sessionId", sessionId);
        const chatHistory = await Chat.find({ sessionId })
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(); // Use lean to get plain JavaScript objects

        // Use Set to collect unique product and community IDs
        const productIdSet = new Set<string>();
        const communityIdSet = new Set<string>();

        // Collect product and community IDs in a single pass
        chatHistory.forEach(chat => {
            chat.productId.forEach(id => productIdSet.add(String(id)));
            chat.communityId.forEach(id => communityIdSet.add(String(id)));
        });

        // Fetch product and community details concurrently
        const productDetailsPromise = productIdSet.size > 0 ? getProductDetails(Array.from(productIdSet)) : Promise.resolve({ success: true, data: [] });
        const communityDetailsPromise = communityIdSet.size > 0 ? getCommunityDetails(Array.from(communityIdSet)) : Promise.resolve({ success: true, data: [] });

        const [productDetails, communityDetails] = await Promise.all([productDetailsPromise, communityDetailsPromise]);

        // Transform chat history with product and community details
        const newChatHistory = chatHistory.map(chat => ({
            id: chat._id,
            message: chat.message,
            role: chat.role,
            isProductSuggested: chat.isProductSuggested,
            isCommunitySuggested: chat.isCommunitySuggested,
            communitySuggested: communityDetails?.success ? communityDetails.data?.find((community: any) => community._id === String(chat.communityId)) : null,
            productSuggested: productDetails?.success ? productDetails.data?.find((product: any) => product._id === String(chat.productId)) : null,
        }));
        console.log(newChatHistory);
        res.status(200).json({
            success: true,
            data: newChatHistory,
        });
    } catch (error: any) {
        console.log(error.message); // Log the error for debugging
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

async function getProductDetails(productId: string[]): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const productDetails = await Product.find({ _id: { $in: productId } }).lean(); // Use lean to get plain JavaScript objects
        return { success: true, data: productDetails };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

async function getCommunityDetails(communityId: string[]): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const communityDetails = await Community.find({ _id: { $in: communityId } }).lean(); // Use lean to get plain JavaScript objects
        return {
            success: true,
            data: communityDetails.map(community => ({
                _id: community._id,
                name: community.name,
                memberCount: community.memberCount,
                description: community.description,
                profileImage: community.profileImageParams,
                bannerImage: community.bannerImageParams,
                tag: community.tags,
            })),
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
