import UserChat from "../../models/userChat.model.js";
import connectDB from "../../db/db.connect.js";
import { Request, Response } from "express";
import { categorizeChatSessions } from "../../utils/utilsFunction.js";

export async function getChatHistory(req: Request, res: Response) {
    await connectDB();

    try {
        const { userId } = await req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Please provide userId"
            })
        }

        const userChat = await UserChat.find({ userId });
        const reducedChat = userChat.reduce((acc: any[], curr) => {
            const newElem = {
                sessionId: curr.sessionId,
                chatName: curr.chatName,
                updatedAt: curr.updatedAt
            };
            acc.push(newElem);
            return acc;
        }, []);

        return res.status(200).json({
            success: true,
            status: 200,
            data: categorizeChatSessions([
                {
                    "sessionId": "7418504-4-8-2-3",
                    "chatName": "Understanding Quantum Computing",
                    "updatedAt": "2024-10-01T11:02:41.320888"
                },
                {
                    "sessionId": "2109596-8-8-8-2",
                    "chatName": "Door Painting Dilemma",
                    "updatedAt": "2024-08-10T11:02:41.320888"
                },
                {
                    "sessionId": "3660218-1-4-1-1",
                    "chatName": "Gardening Tips and Tricks",
                    "updatedAt": "2024-01-08T11:02:41.320888"
                },
                {
                    "sessionId": "4870312-3-0-5-3",
                    "chatName": "Understanding Quantum Computing",
                    "updatedAt": "2024-04-02T11:02:41.320888"
                },
                {
                    "sessionId": "3925369-6-4-4-2",
                    "chatName": "Hey Chat: Mental Health & Wellness",
                    "updatedAt": "2023-12-14T11:02:41.320888"
                },
                {
                    "sessionId": "7834022-5-4-1-0",
                    "chatName": "Door Painting Dilemma",
                    "updatedAt": "2024-07-18T11:02:41.320888"
                },
                {
                    "sessionId": "8560069-2-9-9-8",
                    "chatName": "Door Painting Dilemma",
                    "updatedAt": "2024-08-16T11:02:41.320888"
                },
                {
                    "sessionId": "3039148-9-6-1-9",
                    "chatName": "Pirate's Cove Talk",
                    "updatedAt": "2024-04-25T11:02:41.320888"
                },
                {
                    "sessionId": "5822870-1-3-5-1",
                    "chatName": "Space Exploration Dialogues",
                    "updatedAt": "2023-10-31T11:02:41.320888"
                },
                {
                    "sessionId": "6721695-4-3-2-6",
                    "chatName": "Gardening Tips and Tricks",
                    "updatedAt": "2023-12-28T11:02:41.320888"
                },
                {
                    "sessionId": "5158895-9-4-7-4",
                    "chatName": "Door Painting Dilemma",
                    "updatedAt": "2024-04-19T11:02:41.320888"
                },
                {
                    "sessionId": "8029420-3-8-7-4",
                    "chatName": "Exploring Artificial Intelligence in Virtual Assistants",
                    "updatedAt": "2024-06-21T11:02:41.320888"
                },
                {
                    "sessionId": "5262952-6-7-5-0",
                    "chatName": "Door Painting Dilemma",
                    "updatedAt": "2024-02-28T11:02:41.320888"
                },
                {
                    "sessionId": "7393284-9-1-4-1",
                    "chatName": "Hey Chat: Mental Health & Wellness",
                    "updatedAt": "2024-04-12T11:02:41.320888"
                },
                {
                    "sessionId": "3280601-1-8-3-4",
                    "chatName": "Exploring Artificial Intelligence in Virtual Assistants",
                    "updatedAt": "2023-10-28T11:02:41.320888"
                },
                {
                    "sessionId": "9567024-1-0-4-5",
                    "chatName": "Pirate's Cove Talk",
                    "updatedAt": "2024-07-08T11:02:41.320888"
                },
                {
                    "sessionId": "7347906-9-3-4-3",
                    "chatName": "Door Painting Project Guidance",
                    "updatedAt": "2024-04-13T11:02:41.320888"
                },
                {
                    "sessionId": "4353472-3-5-1-3",
                    "chatName": "Gardening Tips and Tricks",
                    "updatedAt": "2023-10-15T11:02:41.320888"
                },
                {
                    "sessionId": "7212232-3-3-2-3",
                    "chatName": "Space Exploration Dialogues",
                    "updatedAt": "2024-08-13T11:02:41.320888"
                },
                {
                    "sessionId": "4626794-6-2-7-5",
                    "chatName": "Exploring Artificial Intelligence in Virtual Assistants",
                    "updatedAt": "2024-06-29T11:02:41.320888"
                },
                {
                    "sessionId": "1000001-1-1-1-1",
                    "chatName": "Today's Chat: Current Events Discussion",
                    "updatedAt": "2024-10-02T09:00:00.000Z"
                },
                {
                    "sessionId": "1000002-2-2-2-2",
                    "chatName": "Today's Chat: Technology Trends",
                    "updatedAt": "2024-10-02T10:00:00.000Z"
                },
                {
                    "sessionId": "1000003-3-3-3-3",
                    "chatName": "Today's Chat: Health and Wellnessa WellnessaWellnessaWellnessa ",
                    "updatedAt": "2024-10-02T11:00:00.000Z"
                }
            ]
            )
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        })
    }

}