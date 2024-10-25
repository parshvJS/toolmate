import { Socket } from "socket.io";
import { executeIntend, findAndExecuteIntend, GetAnswerFromPrompt, getChatName, getUserIntend } from "./langchain/langchain.js";
import { produceMessage, produceNewMessage } from "./kafka.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { iChatname, INewUserMessage } from "../types/types.js";
import { createnewUserChatInstace } from "../controller/_private/createNewUserChatInstance.controller.js";
import { getRedisData, setRedisData } from "./redis.js";
import connectDB from "../db/db.db.js";
import { UserPayment } from "../models/userPayment.model.js";
import { Chat } from "../models/chat.model.js";

export async function handleSocketSerivce(socket: Socket) {

    console.log('Client connected');

    //   this event will create session in database | check current user paid plan and server as per their plan
    socket.on('createSession', async (message) => {
        const ObjectId = new mongoose.Types.ObjectId();
        console.log('Session Created', ObjectId, socket.id);
        socket.emit('acknowledgement', {
            sessionId: ObjectId,
        });
    });
    // free user 
    socket.on('message', async (message: {
        prompt: string,
        sessionId: string
    }) => {
        const { prompt, sessionId } = message;
        console.log(prompt);
        await GetAnswerFromPrompt(prompt, sessionId, socket);
        await produceMessage(prompt, sessionId, '', 'user');
    });


    // this service creates new session for user
    socket.on('createNewUserSession', () => { handleCreateNewSession(socket) });

    // this service gives name for the chat 
    socket.on('getChatName', async (data: iChatname) => handleGetChatName(socket, data))

    // this service will stream some response
    socket.on('userMessage', async (data: INewUserMessage) => {
        const controller = new AbortController();
        const { signal } = controller;
        socket.on('stop', () => {
            controller.abort();
        });
        console.log("user message", data);

        const redisUserData = await getRedisData(`USER-PAYMENT-${data.userId}`);
        var currentPlan = 0;
        if (redisUserData.success) {
            console.log(data.userId, 'user payment details found in redis');
            const plan = redisUserData.data.planAccess;
            // plan indicated by their number 0 - free , 1 - essential , 2 - pro
            currentPlan = plan[1] == true ? 1 : plan[2] == true ? 2 : 1;
        }
        else {
            await connectDB();
            console.log(data.userId, 'user payment details not found in redis');
            const userPlan = await UserPayment.findOne({
                userId: data.userId
            });
            if (!userPlan) {
                console.log('User payment details not found');
                socket.emit('error', {
                    message: "User not found",
                    success: false
                })
                return;
            }
            const plan = userPlan.planAccess;
            // plan indicated by their number 0 - free , 1 - essential , 2 - pro
            currentPlan = plan[1] == true ? 1 : plan[2] == true ? 2 : 0;
            await setRedisData(`USER-PAYMENT-${data.userId}`, JSON.stringify(userPlan), 3600);
        }
        // no project memory
        const redisChatData = await getRedisData(`USER-CHAT-${data.userId}`);
        var chatHistory;
        if (redisChatData.success) {
            chatHistory = redisChatData.data;
        } else {
            await connectDB();
            const DbChatHistory = await Chat.find({ sessionId: data.sessionId });
            console.log(DbChatHistory, 'DbChatHistory');
            const NLessNum = DbChatHistory.length > 30 ? DbChatHistory.length - 30 : 0;
            chatHistory = DbChatHistory.slice(NLessNum, DbChatHistory.length);
            await setRedisData(`USER-CHAT-${data.userId}`, JSON.stringify(chatHistory), 3600);
        }
        switch (currentPlan) {
            case 1: {
                const intendList = await getUserIntend(data.message, chatHistory, currentPlan);
                const messageSteam = await executeIntend(data.message, chatHistory, data.sessionId, intendList, data.userId, currentPlan, signal, socket);
                
                // handle all the intend    
            }
            case 2: {

            }
            default: {

            }
        }
        // await produceNewMessage(data.message, data.sessionId, false, false, 'user', [], []);
    })


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

}


async function handleCreateNewSession(socket: Socket) {

    const newSessionId = uuidv4();
    console.log("created new session ", newSessionId);
    socket.emit('newSessionAcknowledge', {
        sessionId: newSessionId,
    });

}

// this function will take prompt and emit chatName event with chatName

// if everything goes well it will emit success true
// if something goes wrong it will emit success false
async function handleGetChatName(socket: Socket, data: iChatname) {
    const prompt = data.prompt;
    const chatName = await getChatName(prompt);

    // create new Database instance 

    const isDbEntryCreated = await createnewUserChatInstace({
        sessionId: data.sessionId,
        userId: data.userId,
        chatName: chatName,
    });

    if (!isDbEntryCreated) {
        socket.emit('chatName', {
            success: false,
            sessonId: data.sessionId,
            message: 'Error creating new Chat',
            chatName: chatName
        })
    }
    socket.emit('chatName', {
        success: true,
        sessionId: data.sessionId,
        message: "New Chat Inititalized",
        chatName: chatName,
        id: isDbEntryCreated._id!
    })
}
