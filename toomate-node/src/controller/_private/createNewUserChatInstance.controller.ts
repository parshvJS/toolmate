import connectDB from "../../db/db.connect.js";
import UserChat from "../../models/userChat.model.js";

export async function createnewUserChatInstace({ sessionId, userId, chatName }: {
    sessionId: string,
    userId: string,
    chatName: string
}) {
    await connectDB();
    const userChat = new UserChat({
        userId,
        sessionId,
        chatName
    });
    await userChat.save();
    if (!userChat) {
        return false
    }
    return true
}