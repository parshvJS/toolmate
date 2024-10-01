import { Chat } from '../models/chat.model.js';
import { ChatOpenAI } from '@langchain/openai';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import dotenv from 'dotenv';
import connectDB from '../db/db.connect.js';
import { produceMessage } from './kafka.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
	RunnablePassthrough,
	RunnableSequence,
} from '@langchain/core/runnables';
import { getChatMessages, getPremiumUserChatMessage } from '../utils/utilsFunction.js';
dotenv.config();
const openAIApiKey = process.env.OPENAI_API_KEY!;
const llm = new ChatOpenAI({
	apiKey: openAIApiKey,
	streaming: true, // Enable streaming if supported
});

// service for free preview user
export async function GetAnswerFromPrompt(
	prompt: string,
	sessionId: string,
	socket: Socket
) {
	await connectDB();
	console.log('Getting History-');
	const chatHistory = await Chat.find({ sessionId });
	const shortenChatHistory = chatHistory.reduce((acc: any, chat) => {
		if (acc.length > 15) {
			return acc;
		}
		acc = [
			...acc,
			{
				message: chat.message.slice(0, 350),
				role: chat.role,
			},
		];
		return acc;
	}, []);
	console.log(
		shortenChatHistory,
		'is here ============================================'
	);
	let expression: any;

	try {
		const expressionPrompt = `Given is the prompt from user, as per this question, your job is to give 1 expression that fits for this prompt best,try suggest relavent expression. ${prompt} :Expression List(strictly follow this only no other values):[ laugh, hello, smile, offer, 1thumb, 2thumb, tool]: Selected Expression:`;
		expression = await llm.invoke(expressionPrompt);
		socket.emit('expression', expression);
	} catch (error) {
		console.error('Error fetching expression:', error);
		socket.emit(
			'expressionError',
			'Error occurred while fetching expression.'
		);
	}

	try {
		const streamPrompt = `system prompt:, As a DIY and creative enthusiast, provide an appropriate answer to the user's question. 
		| User Prompt: ${prompt} 
		Context of chat: ${JSON.stringify(shortenChatHistory)} 
		Response (provide a comprehensive answer using markdown format, utilizing all available symbols such as headings, subheadings, lists, etc.):`;
		const stream = await llm.stream(streamPrompt);

		let gatheredResponse = '';

		for await (const chunk of stream) {
			gatheredResponse += chunk.content; // Assuming 'content' is the property holding the text
			socket.emit('message', { text: chunk.content });
		}

		socket.emit('terminate', { done: true });
		await produceMessage(
			gatheredResponse,
			sessionId,
			expression?.kwargs?.content || 'laugh',
			'ai'
		);
		console.log(gatheredResponse, 'gatheredResponse');
	} catch (error) {
		console.error('Error streaming response:', error);
		socket.emit('messageError', 'Error occurred during streaming.');
	}
}

// get intend of user
export async function findAndExecuteIntend(
	prompt: string,
	sessionId: string,
	socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
	const chatHistory = await getPremiumUserChatMessage(
		sessionId,
		Number(process.env.CONTEXT_LIMIT_CHAT) || 15
	); // get chat history from database

	if (chatHistory.length > 0) {
		const getIntendPrompt = `Based on the user's prompt, select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [1, 3]),you can stack the intend also :
1.Normal advice (default, must have)
2.Community suggestion
3.Product suggestion 
4.Guidance for project 
5.Budget Planning
6.Project time estimation
User prompt:{prompt}
Return only the selected intent numbers in an array:`;

		const intendTemplate = PromptTemplate.fromTemplate(getIntendPrompt);

		const intendLLMChain = intendTemplate
			.pipe(llm)
			.pipe(new StringOutputParser());

		const runnableChainOfIntend = RunnableSequence.from([
			intendLLMChain,
			new RunnablePassthrough(),
		]);

		const user_intend = await runnableChainOfIntend.invoke({
			prompt, // User prompt
		});

		console.log('user intend', JSON.parse(user_intend));
		const intend = JSON.parse(user_intend.replace(['`', ' '], ['', '']));

		// go thought all intends of user
		for (let i = 0; i < intend.length; i++) {
			switch (intend[i]) {
				case 1:

					break;
				case 2:
					// get memory from session and database
					// generate
					break;
				case 3:
					// get memory from session and database
					// generate
					break;
				case 4:
					// get memory from session and database
					// generate
					break;
				case 5:
					// get memory from session and database
					// generate
					break;
			}
		}
	}
}

// get normal response for user

// get memory from session and database
// generate

export async function getChatName(prompt: string) {

	const chatNamePrompt = `Given the following prompt, generate a suitable and concise name for this conversation that reflects the main topic or theme: {prompt}: Chat Name:`;
	const chatNameTemplate = PromptTemplate.fromTemplate(chatNamePrompt);

	const chatNameLLMChain = chatNameTemplate
		.pipe(llm)
		.pipe(new StringOutputParser());

	const runnableChainOfChatName = RunnableSequence.from([
		chatNameLLMChain,
		new RunnablePassthrough(),
	]);

	const chatName = await runnableChainOfChatName.invoke({
		prompt, // User prompt
	});
	console.log('chat name', chatName);
	return chatName;
}


