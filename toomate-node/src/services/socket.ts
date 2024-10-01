import { Socket } from "socket.io";
import { findAndExecuteIntend, GetAnswerFromPrompt, getChatName } from "./langchain.js";
import { produceMessage, produceNewMessage } from "./kafka.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { iChatname, INewUserMessage } from "../types/types.js";
import { createnewUserChatInstace } from "../controller/_private/createNewUserChatInstance.controller.js";

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




    socket.on('message', async (message: {
        prompt: string,
        sessionId: string
    }) => {
        const { prompt, sessionId } = message;
        console.log(prompt);
        await GetAnswerFromPrompt(prompt, sessionId, socket);
        await produceMessage(prompt, sessionId, '', 'user');
    });




    // logged in user or premium user

    // socket services
    // 1. create new user session
    // 2. give name of the chat 
    // 3. steam some response 
    // 4. suggest some community
    // 5.  suggest some products
    // 6. stream response 


    // this service creates new session for user
    socket.on('createNewUserSession', () => { handleCreateNewSession(socket) });

    // this service gives name for the chat 
    socket.on('getChatName', async (data: iChatname) => handleGetChatName(socket, data))

    // this service will stream some response
    socket.on('userMessage', async (data: INewUserMessage) => {
        await produceNewMessage(data.message, data.sessionId, false, false, 'user');
        await findAndExecuteIntend(data.message, data.sessionId, socket);
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
    })
}