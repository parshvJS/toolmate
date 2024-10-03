import { ChatSession, ResponseFormat } from "../types/types.js";
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
export function categorizeChatSessions(sessions: ChatSession[]) {
    const response: {
        dateDiff:string,
        data:ResponseFormat[]
    }[] = [];
    const now = new Date();

    const categoryMap: { [key: string]: any[] } = {}; // Temporary storage for categorized data

    sessions.forEach(session => {
        const updatedAt = new Date(session.updatedAt);
        const timeDiff = now.getTime() - updatedAt.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        const weeksDiff = Math.floor(daysDiff / 7);
        const monthsDiff = Math.floor(daysDiff / 30);

        const sessionData = {
            sessionId: session.sessionId,
            chatName: session.chatName,
            id: session.id
        };

        let categoryKey = "";

        if (daysDiff === 0) {
            categoryKey = "today";
        } else if (daysDiff === 1) {
            categoryKey = "yesterday";
        } else if (daysDiff > 1 && daysDiff < 30) {
            categoryKey = `previous_${daysDiff}_days`;
        } else if (weeksDiff < 12) {
            categoryKey = `previous_${weeksDiff}_weeks`;
        } else if (monthsDiff < 12) {
            categoryKey = `previous_${monthsDiff}_months`;
        } else {
            categoryKey = "previous_years";
        }

        // Push the sessionData into the respective category
        categoryMap[categoryKey] = categoryMap[categoryKey] || [];
        categoryMap[categoryKey].unshift(sessionData);
    });

    // Convert categoryMap to the required format [{ dateDiff: '...', data: [...] }]
    Object.keys(categoryMap).forEach(key => {
        response.push({
            dateDiff: key,
            data: categoryMap[key]
        });
    });

    // Sort the response in the desired order
    const order = [
        "today",
        "yesterday",
        ...Array.from({ length: 30 }, (_, i) => `previous_${i + 1}_days`),
        ...Array.from({ length: 12 }, (_, i) => `previous_${i + 1}_weeks`),
        ...Array.from({ length: 12 }, (_, i) => `previous_${i + 1}_months`),
        "previous_years"
    ];

    response.sort((a, b) => {
        return order.indexOf(a.dateDiff) - order.indexOf(b.dateDiff);
    });

    return response;
}
