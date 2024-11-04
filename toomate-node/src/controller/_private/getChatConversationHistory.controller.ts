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

        const userChatHistory = await UserChat.findOne({ sessionId }).lean();

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

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Get total count of messages
        const totalMessages = await Chat.countDocuments({ sessionId });

        // Fetch chat history with proper pagination
        const chatHistory = await Chat.find({ sessionId })
            // .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)
            .lean();

        // Use Set to collect unique product and community IDs
        const productIdSet = new Set<string>();
        const communityIdSet = new Set<string>();

        // Collect product and community IDs
        chatHistory.forEach(chat => {
            if (chat.productId) {
                chat.productId.forEach(id => productIdSet.add(String(id)));
            }
            if (chat.communityId) {
                chat.communityId.forEach(id => communityIdSet.add(String(id)));
            }
        });

        // Fetch product and community details concurrently
        // const [productDetails, communityDetails] = await Promise.all([
        //     productIdSet.size > 0 ? getProductDetails(Array.from(productIdSet)) : Promise.resolve({ success: true, data: [] }),
        //     communityIdSet.size > 0 ? getCommunityDetails(Array.from(communityIdSet)) : Promise.resolve({ success: true, data: [] })
        // ]);
        // console.log("Product Details:", productDetails, "Community Details:", communityDetails);
        // Transform chat history with product and community details
        const newChatHistory = chatHistory.map(chat => ({
            id: chat._id,
            message: chat.message,
            role: chat.role,
            createdAt: chat.createdAt,
            isProductSuggested: chat.isProductSuggested,
            isCommunitySuggested: chat.isCommunitySuggested,
            communitySuggested: chat.communityId, 
            productSuggested: chat.productId 
        }));

        res.status(200).json({
            success: true,
            data: newChatHistory,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                hasMore: totalMessages > skip + limit
            }
        });

    } catch (error: any) {
        console.error("Chat History Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

async function getProductDetails(productId: string[]): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const productDetails = await Product.find({ _id: { $in: productId } }).lean();
        console.log("Product Details:", productDetails);
        return { success: true, data: productDetails };
    } catch (error: any) {
        console.error("Product Details Error:", error);
        return { success: false, message: error.message };
    }
}

async function getCommunityDetails(communityId: string[]): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const communityDetails = await Community.find({ _id: { $in: communityId } }).lean();
        console.log("Community Details:", communityDetails);
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
        console.error("Community Details Error:", error);
        return { success: false, message: error.message };
    }
}