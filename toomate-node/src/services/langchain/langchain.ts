import { Chat } from '../../models/chat.model.js';
import { ChatOpenAI } from '@langchain/openai';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import dotenv from 'dotenv';
import connectDB from '../../db/db.connect.js';
import { produceMessage, produceNewMessage } from '../kafka.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
	RunnablePassthrough,
	RunnableSequence,
} from '@langchain/core/runnables';
import { getChatMessages, getPremiumUserChatMessage } from '../../utils/utilsFunction.js';
import { tool } from "@langchain/core/tools";
import { tools } from './tools.js';
import { getRedisData, setRedisData } from '../redis.js';
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
	userId: string,
	socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
	plan: number
) {
	console.log("prompt", prompt);
	const chatHistory = await getPremiumUserChatMessage(
		sessionId,
		Number(process.env.CONTEXT_LIMIT_CHAT) || 15
	); // get chat history from database
	console.log("chatHistory", chatHistory);
	let getIntendPrompt = '';

	if (plan == 1) {
		getIntendPrompt = `Based on the user's prompt, select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [1, 3]):
		1. general response
		2. community recommendation
		3. product recommendation
		4. follow up question for more understanding
		5. Guidance of project
		User prompt: ${prompt}
		i. your job is to indicate the intend of user from the list above
		ii. 1.General Response should always be there in array by default 
		Return only the selected intent numbers in an array(response should contain only array that can be parsable to array):Array:`;
	}
	else if (plan == 2) {
		getIntendPrompt = `Based on the user's prompt, select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [1, 3]):
		1. general response
		2. community recommendation
		3. product recommendation
		4. follow up question for more understanding
		5. Guidance of project
		User prompt: ${prompt}
		i. your job is to indicate the intend of user from the list above
		ii. 1.General Response should always be there in array by default 
		Return only the selected intent numbers in an array(response should contain only array that can be parsable to array):Array:`;
	}
	else {
		getIntendPrompt = `Based on the user's prompt, select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [1, 3]):
		1. general response
		4. follow up question for more understanding
		5. Guidance of project
		User prompt: ${prompt}
		i. your job is to indicate the intend of user from the list above
		ii. 1.General Response should always be there in array by default 
		Return only the selected intent numbers in an array(response should contain only array that can be parsable to array):Array:`;
	}


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

	switch (intend) {
		// general response
		case 1: { }
	}

}


async function streamResponse(sessionId: string, prompt: string, chatHistory: any[], socket: Socket) {
	console.log("Streaming response for", prompt);
	let gatheredResponse = '';
	const streamPrompt = `system prompt:, As a DIY and creative enthusiast, provide an appropriate answer to the user's question. 
	| User Prompt: ${prompt} 
	Context of chat: ${JSON.stringify(chatHistory)} 
	Response (provide a comprehensive answer using markdown format, utilizing all available symbols such as headings, subheadings, lists, etc.):`;
	const stream = await llm.stream(streamPrompt);

	for await (const chunk of stream) {
		gatheredResponse += chunk.content; // Assuming 'content' is the property holding the text
		socket.emit('message', { text: chunk.content });
	}
	socket.emit('terminate', { done: true });

	await produceNewMessage(
		gatheredResponse,
		sessionId,
		false,
		false,
		'ai'
	);
}


export async function findAndExecuteIntend1(
	prompt: string,
	sessionId: string,
	socket: Socket
) {
	// Fetch chat history from the database
	const chatHistory = await getPremiumUserChatMessage(
		sessionId,
		Number(process.env.CONTEXT_LIMIT_CHAT) || 15
	);

	// Define a tool for providing normal advice
	const normalAdvice = tool(
		async function tool1(prompt: string) {
			console.log('Normal advice received:', prompt);
			// Return a response or perform any other action here
			return `Here's some advice: ${prompt}`;
		},
		{
			name: "normal_advice",
			description: "This tool will give normal advice to the user",
		}
	);

	// Create a new LLM instance and bind the tool to it
	const llmWithTools = llm.bindTools(tools);

	try {
		// Use the LLM with the tools
		const response = await llmWithTools.invoke(prompt); // Pass the user prompt
		console.log(response, "response");

		// Optionally send the response back to the user via the socket
		socket.emit('response', response); // Adjust this based on your socket event
	} catch (error) {
		console.error('Error invoking LLM:', error);
		socket.emit('error', 'Failed to get a response from the LLM.');
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


export async function getUserIntend(prompt: string, plan: number): Promise<number[]> {
	let getIntendPrompt = '';

	if (plan == 1) {
		getIntendPrompt = `Based on the user's prompt, select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [1, 3]):
		1. general response
		2. community recommendation
		3. product recommendation
		4. follow up question for more understanding
		5. Guidance of project
		User prompt: ${prompt}
		i. your job is to indicate the intend of user from the list above
		ii. 1.General Response should always be there in array by default 
		Return only the selected intent numbers in an array(response should contain only array that can be parsable to array):Array:`;
	}
	else if (plan == 2) {
		getIntendPrompt = `Based on the user's prompt, select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [1, 3]):
		1. general response
		2. community recommendation
		3. product recommendation
		4. follow up question for more understanding
		5. Guidance of project
		User prompt: ${prompt}
		i. your job is to indicate the intend of user from the list above
		ii. 1.General Response should always be there in array by default 
		Return only the selected intent numbers in an array(response should contain only array that can be parsable to array):Array:`;
	}
	else {
		getIntendPrompt = `Based on the user's prompt, select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [1, 3]):
		1. general response
		4. follow up question for more understanding
		5. Guidance of project
		User prompt: ${prompt}
		i. your job is to indicate the intend of user from the list above
		ii. 1.General Response should always be there in array by default 
		Return only the selected intent numbers in an array(response should contain only array that can be parsable to array):Array:`;
	}

	const intendTemplate = PromptTemplate.fromTemplate(getIntendPrompt);

	const intendLLMChain = intendTemplate
		.pipe(llm)
		.pipe(new StringOutputParser());

	const runnableChainOfIntend = RunnableSequence.from([
		intendLLMChain,
		new RunnablePassthrough(),
	]);

	const userIntend = await runnableChainOfIntend.invoke({
		prompt, // User prompt
	});

	console.log('user intend', JSON.parse(userIntend));
	return JSON.parse(userIntend.replace(/[` ]/g, ''));
}

// intend list and user Id
export async function executeIntend(prompt: string, sessionId: string, intend: number[], userId: string, plan: number, signal: AbortSignal, socket: Socket) {
	// no project memory
	const redisChatData = await getRedisData(`USER-CHAT-${userId}`);
	var chatHistory;
	if (redisChatData.success) {
		chatHistory = redisChatData.data;
	} else {
		await connectDB();
		const DbChatHistory = await Chat.find({ sessionId: sessionId });
		console.log(DbChatHistory, 'DbChatHistory');
		const NLessNum = DbChatHistory.length > 30 ? DbChatHistory.length - 30 : 0;
		chatHistory = DbChatHistory.slice(NLessNum, DbChatHistory.length);
		await setRedisData(`USER-CHAT-${userId}`, JSON.stringify(chatHistory), 3600);
	}
	var newChat = {
		sessionId: userId,
		message: '',
		role: 'ai',
		isProductSuggested: false,
		isCommunitySuggested: false,
		communityId: [],
		productId: []
	};
	if (plan == 1) {
		for (let i = 0; i < intend.length; i++) {
			switch (intend[i]) {
				// general response
				case 1: {
					socket.emit('status', {
						message: "Matey Is Typing..."
					})
					const generalResponse = await HandleGeneralResponse(prompt, chatHistory, signal, socket);
					newChat['message'] = generalResponse;
				}
				// community recommendation
				case 2: {
					socket.emit('status', {
						message: "Matey Is Finding Community For You..."
					})
					newChat['isCommunitySuggested'] = true;
					const communityId = await HandleCommunityRecommendation(prompt, chatHistory, signal, socket);

				}
				// product recommendation
				case 3: {
					socket.emit('status', {
						message: "Matey Is Finding Product For You..."
					})
					newChat['isProductSuggested'] = true;
					const productId = await HandleProductRecommendation(prompt, chatHistory, signal, false, null, socket);
				}
				// follow up question for more understanding
				case 4: {

				}
				// Guidance of project
				case 5: {

				}
				default: { }
			}
		}
	}
}


async function HandleGeneralResponse(prompt: string, chatHistory: [], signal: AbortSignal, socket: Socket) {
	const streamPrompt = `system prompt:, As a DIY and creative enthusiast, provide an appropriate answer to the user's question. 
	| User Prompt: ${prompt} 
	Context of chat(use This If Present,else just use prompt to reply): ${chatHistory.length !== 0 ? JSON.stringify(chatHistory) : "Context not available"} 
	Response (provide a comprehensive answer using markdown format, utilizing all available symbols such as headings, subheadings, lists, etc.):`;
	const stream = await llm.stream(streamPrompt);

	let gatheredResponse = '';

	for await (const chunk of stream) {
		if (signal.aborted) {
			break;
		}
		gatheredResponse += chunk.content; // Assuming 'content' is the property holding the text
		socket.emit('message', { text: chunk.content });
	}
	socket.emit('terminate', { done: true });

	return gatheredResponse;
}

async function HandleCommunityRecommendation(prompt: string, chatHistory: [], signal: AbortSignal, socket: Socket) {

}

async function HandleProductRecommendation(prompt: string, chatHistory: [], signal: AbortSignal, isBudgetAvailable: boolean, budget: number | null, socket: Socket) {

}
