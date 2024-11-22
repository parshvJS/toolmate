import { Socket } from "socket.io";
import { abstractChathistory, executeIntend, findAndExecuteIntend, FindNeedOfBudgetSlider, GetAnswerFromPrompt, getChatName, getMateyExpession, getUserIntend, inititalSummurizeChat } from "./langchain/langchain.js";
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
        await GetAnswerFromPrompt(prompt, sessionId, socket);
        await produceMessage(prompt, sessionId, '', 'user');
    });

  
    // this service creates new session for user
    socket.on('createNewUserSession', () => { handleCreateNewSession(socket) });

    // this service gives name for the chat 
    socket.on('getChatName', async (data: iChatname) => handleGetChatName(socket, data))

    socket.on('userMessage', async (data: INewUserMessage) => {
        try {
            console.log("budgetDetails in socket","budgetDetails",data.budgetSliderValue, "isBudgetSliderChangable", data.isBudgetSliderChangable, "isBudgetSliderPresent", data.isBudgetSliderPresent);
            // Initialize controller for stream handling
            const controller = new AbortController();
            const { signal } = controller;

            // Store initial message
            produceNewMessage(
                data.message,
                data.sessionId,
                false,
                false,
                false,
                [],
                [],
                [],
                false,
                [],
                "user",
            )
            // Setup stop handler early
            socket.once('stop', () => {
                controller.abort();
            });

            // Get chat history from cache or DB
            const cacheKey = `USER-CHAT-${data.sessionId}`;
            const chatHistory = await getRedisData(cacheKey).then(async (redisChatData) => {
                if (redisChatData.success) {
                    return redisChatData.data;
                }

                await connectDB();
                const dbChatHistory = await Chat.find({ sessionId: data.sessionId })
                    .sort({ _id: -1 })
                    .limit(30);

                if (dbChatHistory.length > 0) {
                    const chatHistoryStore = dbChatHistory.map(chat => ({
                        role: chat.role,
                        message: chat.message,
                    }));

                    const contextedChat = await inititalSummurizeChat(JSON.stringify(chatHistoryStore));
                    await setRedisData(cacheKey, JSON.stringify(contextedChat), 3600);
                    return contextedChat;
                }

                return [];
            });

            // Process new chat context
            const newChatContext = await abstractChathistory(chatHistory, {
                message: data.message,
                role: 'user',
            });
            await appendArrayItemInRedis(cacheKey, newChatContext);

            // Get user plan from cache or DB
            const userPlanCacheKey = `USER-PAYMENT-${data.userId}`;
            const currentPlan = await getRedisData(userPlanCacheKey).then(async (redisUserData) => {
                if (redisUserData.success) {
                    const plan = JSON.parse(redisUserData.data).planAccess;
                    return plan[2] ? 2 : plan[1] ? 1 : 0;
                }

                await connectDB();

                const user = await User.findOne({ clerkUserId: data.userId });
                if (!user) {
                    throw new Error('User not found');
                }

                const userPlan = await UserPayment.findOne({ userId: user._id });
                if (!userPlan) {
                    throw new Error('User payment details not found');
                }

                await setRedisData(userPlanCacheKey, JSON.stringify(userPlan), 3600);
                return userPlan.planAccess[2] ? 2 : userPlan.planAccess[1] ? 1 : 0;
            });

            // Process based on plan type
            switch (currentPlan) {
                case 1: {
                    await getMateyExpession(data.message, socket);
                    const intendList = await getUserIntend(data.message, newChatContext, currentPlan);
                    socket.emit('intendList', intendList);

                    const messageStream = await executeIntend(
                        data.message,
                        newChatContext,
                        data.sessionId,
                        intendList,
                        data.userId,
                        currentPlan,
                        signal,
                        false,
                        0,
                        socket
                    );

                    if (messageStream) {
                   
                        await Promise.all([
                            produceNewMessage(
                                messageStream.message,
                                data.sessionId,
                                messageStream.isProductSuggested,
                                messageStream.isMateyProduct,
                                messageStream.isBunningsProduct,
                                messageStream.productSuggestionList,
                                messageStream.mateyProduct,
                                messageStream.bunningsProductList,
                                messageStream.isCommunitySuggested,
                                messageStream.communityId || [],
                                "ai"
                            ),
                            produceNewMessage(
                                messageStream.emo,
                                data.sessionId,
                                false,
                                false,
                                false,
                                [],
                                [],
                                [],
                                false,
                                [],
                                "ai",
                            )
                        ]);

                        const newAiAddedChatHistory = await abstractChathistory(chatHistory, {
                            message: messageStream.message || "",
                            role: 'ai',
                        });
                        await appendArrayItemInRedis(cacheKey, newAiAddedChatHistory);
                    }
                    break;
                }

                case 2: {
                    await getMateyExpession(data.message, socket);

                    const intendListPro = await getUserIntend(data.message, newChatContext, currentPlan);
                    socket.emit('intendList', intendListPro);

                    const messageStreamPro = await executeIntend(
                        data.message,
                        newChatContext,
                        data.sessionId,
                        intendListPro,
                        data.userId,
                        currentPlan,
                        signal,
                        Boolean(data.budgetSliderValue),
                        data.budgetSliderValue || 0,
                        socket
                    );
                    if (messageStreamPro) {

                        await Promise.all([
                            produceNewMessage(
                                messageStreamPro.message,
                                data.sessionId,
                                messageStreamPro.isProductSuggested,
                                messageStreamPro.isMateyProduct,
                                messageStreamPro.isBunningsProduct,
                                messageStreamPro.productSuggestionList,
                                messageStreamPro.mateyProduct,
                                messageStreamPro.bunningsProductList,
                                messageStreamPro.isCommunitySuggested,
                                messageStreamPro.communityId || [],
                                "ai"
                            ),
                            produceNewMessage(
                                messageStreamPro.emo,
                                data.sessionId,
                                false,
                                false,
                                false,
                                [],
                                [],
                                [],
                                false,
                                [],
                                "ai",
                            )
                        ]);
                    }

                    if(data.isBudgetSliderChangable){
                        await FindNeedOfBudgetSlider(data.message,newChatContext, socket);
                    }
                    break;
                }

                default:
                    socket.emit('error', "No valid plan found");
            }

        } catch (error: any) {
            console.error('Error processing message:', error);
            socket.emit('error', {
                message: error.message || 'An error occurred while processing your message',
                success: false
            });
        } finally {
            socket.emit('statusOver', {});
        }
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

}


async function handleCreateNewSession(socket: Socket) {

    const newSessionId = uuidv4();
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
