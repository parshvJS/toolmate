import { Socket } from "socket.io";
import { executeIntend, findAndExecuteIntend, FindNeedOfBudgetSlider, GetAnswerFromPrompt, getChatName, getUserIntend } from "./langchain/langchain.js";
import { produceMessage, produceNewMessage } from "./kafka.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { iChatname, INewUserMessage } from "../types/types.js";
import { createnewUserChatInstace } from "../controller/_private/createNewUserChatInstance.controller.js";
import { appendArrayItemInRedis, getRedisData, setRedisData } from "./redis.js";
import connectDB from "../db/db.db.js";
import { UserPayment } from "../models/userPayment.model.js";
import { Chat } from "../models/chat.model.js";
import User from "../models/user.model.js";

export async function handleSocketSerivce(socket: Socket) {

    console.log('Client connected', socket.id, '----------------------------------');

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
            console.log('stop signal received-------------------------------------------------------------------');
            controller.abort();
        });
        console.log("storange module----------------------------------", data);
        await produceNewMessage(data.message || "", data.sessionId, false, false, "user", [], []);
        console.log('message produced,redis start');
        await appendArrayItemInRedis(`USER-CHAT-${data.sessionId}`, {
            message: data.message,
            type: 'user',
        })
        const redisUserData = await getRedisData(`USER-PAYMENT-${data.userId}`);
        var currentPlan = 0;
        if (redisUserData.success) {
            console.log(data.userId, 'user payment details found in redis');
            const plan = JSON.parse(redisUserData.data).planAccess;
            // plan indicated by their number 0 - free , 1 - essential , 2 - pro
            currentPlan = plan[1] == true ? 1 : plan[2] == true ? 2 : 1;
        }
        else {
            await connectDB();
            console.log(data.userId, 'user payment details not found in redis');
            const user = await User.findOne({ clerkUserId: data.userId });
            if (!user) {
                console.log('User not found');
                socket.emit('error', {
                    message: "User not found",
                    success: false
                })
                return;
            }
            const userPlan = await UserPayment.findOne({
                userId: user._id
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
        const redisChatData = await getRedisData(`USER-CHAT-${data.sessionId}`);
        var chatHistory;
        if (redisChatData.success) {
            chatHistory = redisChatData.data;
        } else {
            await connectDB();
            const DbChatHistory = await Chat.find({ sessionId: data.sessionId });
            console.log(DbChatHistory, 'DbChatHistory');
            const NLessNum = DbChatHistory.length > 30 ? DbChatHistory.length - 30 : 0;
            chatHistory = DbChatHistory.slice(NLessNum, DbChatHistory.length);
            await setRedisData(`USER-CHAT-${data.sessionId}`, chatHistory, 3600);
        }
        switch (currentPlan) {
            case 1: {
                console.log("Processing...")
                const intendList = await getUserIntend(data.message, chatHistory, currentPlan);
                socket.emit('intendList', intendList);
                console.log('intendList done', intendList);
                const messageSteam = await executeIntend(data.message, chatHistory, data.sessionId, intendList, data.userId, currentPlan, signal, false, 0, socket);
                if (messageSteam) {
                    await produceNewMessage(messageSteam?.message || "", data.sessionId, messageSteam.isProductSuggested, messageSteam.isCommunitySuggested, "ai", messageSteam.communityId, messageSteam.productId);
                    console.log('messageSteam done--------------------------', messageSteam);
                    await appendArrayItemInRedis(`USER-CHAT-${data.sessionId}`, messageSteam);
                    console.log('messageSteam done', messageSteam);
                }
                // budget slider
                socket.emit('statusOver', {})

                // handle all the intend    
                break;
            }
            case 2: {
                const intendList = await getUserIntend(data.message, chatHistory, currentPlan);
                socket.emit('intendList', intendList);
                if (data.budgetSliderValue) {
                    const messageSteam = await executeIntend(data.message, chatHistory, data.sessionId, intendList, data.userId, currentPlan, signal, true, data.budgetSliderValue, socket);
                }
                else {
                    const messageSteam = await executeIntend(data.message, chatHistory, data.sessionId, intendList, data.userId, currentPlan, signal, false, 0, socket);
                }

                // budget slider
                const isBudgetSliderPresent = data.isBudgetSliderPresent;
                if (!isBudgetSliderPresent) {
                    if (chatHistory.length > 3) {
                        const isBudgetSliderNeeded = await FindNeedOfBudgetSlider(chatHistory, socket);
                    }
                }
                socket.emit('statusOver', {})
                break;

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
