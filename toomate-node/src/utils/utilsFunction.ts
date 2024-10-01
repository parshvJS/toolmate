import { Chat } from "../models/chat.model.js";

export async function getChatMessages(sessionId: string, memorySize: number) {
    const chatHistory = await Chat.find({ sessionId });
    if (chatHistory.length > memorySize) {
        return chatHistory.slice(chatHistory.length - memorySize, chatHistory.length);
    }
    return chatHistory;
}

export async function getPremiumUserChatMessage(sessionId: string, memorySize: number) {
    const chatHistory = await Chat.find({ sessionId }, { sort: { createdAt: -1 } });
    if (chatHistory.length > memorySize) {
        return chatHistory.slice(chatHistory.length - memorySize, chatHistory.length);
    }
    return chatHistory;
}