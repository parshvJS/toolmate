import { Socket } from "socket.io";
import { GetAnswerFromPrompt } from "./langchain.js";
import { produceMessage } from "./kafka.js";
import mongoose from "mongoose";

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

    //   socket.on('message', async (message) => {
    //     const { prompt } = message;
    //     console.log(prompt);

    //     try {
    //       const chatResponse = await model.stream(prompt);

    //       for await (const chunk of chatResponse) {
    //         if (socket.connected) {
    //           console.log(JSON.stringify(chunk));
    //           socket.emit('response', { text: chunk });
    //         }
    //       }

    //       // Close the connection after the response is fully sent
    //       socket.emit('response', { done: true });
    //     } catch (error) {
    //       console.error('Error streaming response:', error);
    //       socket.emit('response', { error: 'Error fetching response from GPT' });
    //     }
    //   });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

}