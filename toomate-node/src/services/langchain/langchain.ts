import { Chat } from '../../models/chat.model.js';
import { ChatOpenAI } from '@langchain/openai';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import dotenv from 'dotenv';
import connectDB from '../../db/db.db.js';
import { produceMessage, produceNewMessage } from '../kafka.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
	RunnablePassthrough,
	RunnableSequence,
} from '@langchain/core/runnables';
import { getPremiumUserChatMessage, parseJsonString, wrapWordsInQuotes } from '../../utils/utilsFunction.js';
import { tool } from "@langchain/core/tools";
import { tools } from './tools.js';
import { getRedisData, setRedisData } from '../redis.js';
import ProductCatagory from '../../models/productCatagory.model.js';
import Product from '../../models/adsense/product.model.js';
import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import UserMemory from '../../models/userMemory.model.js';
import { encode } from 'gpt-tokenizer';
import axios from 'axios';
import BunningsProduct from '../../models/BunningsProduct.model.js';
import { IBunningsChat } from '../../types/types.js';

dotenv.config();
const openAIApiKey = process.env.OPENAI_API_KEY!;
const llm = new ChatOpenAI({
	apiKey: openAIApiKey,
	streaming: true, // Enable streaming if supported
	model: "gpt-3.5-turbo-0125",
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
		socket.emit('error', 'Error occurred during streaming.');
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

	produceNewMessage(
		gatheredResponse,
		sessionId,
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


export async function getUserIntend(prompt: string, chatHistory: string, plan: number): Promise<number[]> {
	let getIntendPrompt = '';
	console.log('plan:', plan, 'prompt:', prompt, 'chatHistory:', chatHistory);
	if (plan === 1) {
		getIntendPrompt = `Based on the user's prompt and chat history, analyze the context to select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [2, 3]).

		System Prompt :
		  - Your Are AI Chat bot whose Name is Matey
		  - You are a DIY and creative enthusiast
		  - You’re here to help users with their DIY and creative projects, adding friendly, playful encouragement along the way
		
		Intent Selection Criteria:
		  2. Community Recommendation (Suggest this if the user expresses difficulty or seeks peer support)
		  3. Product Recommendation (Prioritize this if the user’s prompt indicates a need for a specific tool or resource)
		  4. Follow-up Question for More Understanding (Use this if the prompt is vague or needs clarification)
		  5. Guidance on the Project (Select this if the user is asking for advice or direction)
		  6. Emotional Playfulness with Matey(Give extra promotion to this)* - Select this if adding a friendly, emotionally supportive tone would enhance the response. Matey’s playful personality can help make the user feel more confident and motivated, so consider selecting this option in most cases where Matey’s unique style can add value to the response.
		
		User Intent Analysis:
		1. Evaluate the user’s mood and urgency: Does the user sound frustrated, confused, or uncertain? If so, lean towards community recommendations, guidance, or playfulness with Matey (Intent 6) for encouragement.
		2. Assess previous interactions: If they recently discussed a tool or project, consider product recommendations that relate to that topic.
		3. Look for specific keywords in the user prompt: Keywords like "help," "recommend," "need," or "advice" can guide intent selection.
		4. Consider the user’s experience level: For beginners, focus on guidance or emotional playfulness; for advanced users, consider product recommendations.
		5. Emotional Playfulness with Matey: This should be prioritized to create a more enjoyable, friendly experience whenever possible. Highly add this  
		6. is you see need of budget slider and there is not specified need of products then dont include product recommendation

		**Chat History**: {chatHistory}
		**User Prompt**: {prompt}
		
		Your task is to synthesize the information from the user's prompt and chat history to determine their intent from the list above. 
		- Weigh the relevance of each intent based on the context and user cues.
		- Return only the selected intent numbers in an array (response should contain only an array that can be parsed to JSON): Array:
		`;
	}
	else if (plan === 2) {
		getIntendPrompt = `Based on the user's prompt and chat history, analyze the context to select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [2, 3]).

		System:
		  - Your Name is Matey
		  - You are a DIY and creative enthusiast
		  - You’re here to help users with their DIY and creative projects, adding friendly, playful encouragement along the way
		
		Intent Selection Criteria:
		  2. Community Recommendation (Suggest this if the user expresses difficulty or seeks peer support)
		  3. Product Recommendation (Prioritize this if the user’s prompt indicates a need for a specific tool or resource)
		  4. Follow-up Question for More Understanding (Use this if the prompt is vague or needs clarification)
		  5. Guidance on the Project (Select this if the user is asking for advice or direction)
		  6. **Emotional Playfulness with Matey** *(Give extra promotion to this)* - Select this if adding a friendly, emotionally supportive tone would enhance the response. Matey’s playful personality can help make the user feel more confident and motivated, so consider selecting this option in most cases where Matey’s unique style can add value to the response.
		
		User Intent Analysis:
		1. Evaluate the user’s mood and urgency: Does the user sound frustrated, confused, or uncertain? If so, lean towards community recommendations, guidance, or playfulness with Matey (Intent 6) for encouragement.
		2. Assess previous interactions: If they recently discussed a tool or project, consider product recommendations that relate to that topic.
		3. Look for specific keywords in the user prompt: Keywords like "help," "recommend," "need," or "advice" can guide intent selection.
		4. Consider the user’s experience level: For beginners, focus on guidance or emotional playfulness; for advanced users, consider product recommendations.
		5. Emotional Playfulness with Matey: This should be prioritized to create a more enjoyable, friendly experience whenever possible. 
		6. is you see need of budget slider and there is not specified need of products then dont include product recommendation

		
		**Chat History**: {chatHistory}
		**User Prompt**: {prompt}
		
		Your task is to synthesize the information from the user's prompt and chat history to determine their intent from the list above. 
		- Weigh the relevance of each intent based on the context and user cues.
		- Return only the selected intent numbers in an array (response should contain only an array that can be parsed to JSON): Array:
		`;
	}
	else {
		getIntendPrompt = `
	Based on the user's prompt and chat history, analyze the context to select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [2, 3]):
	
	2. Community recommendation (suggest if the user expresses difficulty or seeks peer support)
	3. Product recommendation (prioritize if the user's prompt indicates a need for a tool or resource)
	4. Follow-up question for more understanding (use this if the prompt is vague or needs clarification)
	5. Guidance on the project (select this if the user is asking for advice or direction)
	
	**User Intent Analysis**:
	1. Evaluate the user's mood and urgency: Does the user sound frustrated, confused, or uncertain? If so, lean towards community recommendations or guidance.
	2. Assess previous interactions: What have they discussed recently? If they mentioned a specific tool or project, prioritize product recommendations related to that.
	3. Look for specific keywords in the user prompt: Keywords like "help," "recommend," "need," or "advice" can guide intent selection.
	4. Consider the user's experience level: If the user is a beginner, focus more on guidance and community resources; if they're advanced, product recommendations might be more appropriate.
	5. include 4. follow up question when there is some context of chat and more context can improve the user experience
	**Chat History**: {chatHistory}
	**User Prompt**: {prompt}
	
	Your task is to synthesize the information from the user's prompt and chat history to determine their intent from the list above. 
	- Weigh the relevance of each intent based on the context and user cues.
	- Return only the selected intent numbers in an array (response should contain only an array that can be parsed to JSON): Array:`;
	}
	// Build the prompt chain for the LLM
	const intendTemplate = PromptTemplate.fromTemplate(getIntendPrompt);
	const intendLLMChain = intendTemplate
		.pipe(llm)
		.pipe(new StringOutputParser());

	const runnableChainOfIntend = RunnableSequence.from([intendLLMChain, new RunnablePassthrough()]);

	// Invoke the LLM to get the response
	const userIntend = await runnableChainOfIntend.invoke({ prompt, chatHistory });

	// Parse and clean up the output
	let intentArray;
	try {
		intentArray = JSON.parse(userIntend.trim());
	} catch (error: any) {
		console.error('Error parsing user intent:', error.message);
		intentArray = [5];

	}

	// Ensure intent 1 is always present
	intentArray = [1, ...intentArray];

	console.log('user intend:', intentArray);
	return intentArray;
}

// intend list and user Id
export async function executeIntend(
	prompt: string,
	chatHistory: string,
	sessionId: string,
	intend: number[],
	userId: string,
	plan: number,
	signal: AbortSignal,
	isBudgetSliderValue: boolean,
	budgetSliderValue: number,
	socket: Socket
) {
	var newChat = {
		sessionId: userId,
		role: 'ai',
		message: '',
		isCommunitySuggested: false,
		communityId: [],
		isProductSuggested: false,
		isBunningsProduct: false,
		isMateyProduct: false,
		mateyProduct: [] as any,
		productSuggestionList: [] as any,
		bunningsProductList: [] as string[],
		emo: '',
	};

	console.log('Intend:', intend, "chat history", chatHistory); // Debugging log

	// TODO: Remove this below condition and code all features for pro plan currently plan 2
	if (plan == 1 || plan == 2) {
		for (let i = 0; i < intend.length; i++) {
			switch (intend[i]) {
				// General response
				case 1: {
					socket.emit('status', {
						message: "Matey Is Typing..."
					});
					const generalResponse = await HandleGeneralResponse(prompt, chatHistory, signal, intend.includes(3), intend.includes(2), socket);
					newChat['message'] = generalResponse;
					break;
				}
				// Community recommendation
				case 2: {
					socket.emit('status', {
						message: "Matey Is Finding Community For You..."
					});
					newChat['isCommunitySuggested'] = true;
					const communityId = await HandleCommunityRecommendation(prompt, chatHistory, signal, socket);
					break;
				}
				// Product recommendation
				case 3: {
					socket.emit('status', {
						message: "Matey Is Finding Product For You..."
					});

					// const productIntent = await findAndSuggestProduct(prompt, chatHistory, socket);
					const productIntent = {
						success: true,
						data: [1, 2, 3]
					}

					// if (!productIntent.success) {
					// 	socket.emit('error', 'Error occurred while fetching product intent.');
					// 	return newChat;
					// }

					// Emit the product list first
					// socket.emit('productList', productIntent.data);
					socket.emit('productList', [1, 2, 3]);

					// Map over product intents and create promises for each
					let bunningsProductList: IBunningsChat[] | undefined = undefined;
					let adsenseProductList: any[] | undefined = undefined;
					let aiProductList: any[] | undefined = undefined;

					// const productPromises = productIntent.data.map(async (intent: number | string) => {
					const productPromises = [1, 2, 3].map(async (intent: number | string) => {
						console.log('Processing intent:', intent); // Debugging log
						switch (intent) {
							case 1:
								return handleBunningsProduct(prompt, chatHistory, sessionId, isBudgetSliderValue, budgetSliderValue, 0, socket)
									.then((bunningsProducts) => {
										bunningsProductList = bunningsProducts;
										console.log('Bunnings products:', bunningsProducts); // Debugging log
										// socket.emit('bunningsProducts', bunningsProducts);
										return bunningsProducts;
									})
									.catch((error) => {
										console.error('Error fetching Bunnings products:', error); // Debugging log
										socket.emit('error', 'Error fetching Bunnings products.');
										return null;
									});

							case 2:
								return HandleProductRecommendation(prompt, chatHistory, signal, isBudgetSliderValue, budgetSliderValue, socket)
									.then((adsenseProducts) => {
										adsenseProductList = adsenseProducts;
										console.log('Adsense products:', adsenseProducts); // Debugging log
										socket.emit('productId', adsenseProducts);
										return adsenseProducts;
									})
									.catch((error) => {
										console.error('Error fetching Adsense products:', error); // Debugging log
										socket.emit('error', 'Error fetching Adsense products.');
										return null;
									});

							case 3:
								return handleMateyProduct(prompt, chatHistory, sessionId, socket)
									.then((aiProducts) => {
										aiProductList = aiProducts;
										console.log('AI products:', aiProducts); // Debugging log
										socket.emit('aiProducts', aiProducts);
										return aiProducts;
									})
									.catch((error) => {
										console.error('Error fetching AI products:', error); // Debugging log
										socket.emit('error', 'Error fetching AI products.');
										return null;
									});

							default:
								console.error('Invalid product intent selected:', intent); // Debugging log
								socket.emit('error', 'Invalid product intent selected.');
								return Promise.resolve(null); // Handle unexpected intent cases
						}
					});

					// Wait for all product promises to resolve
					await Promise.all(productPromises);

					// Check if Bunnings product intent is included
					if (bunningsProductList && Array.isArray(bunningsProductList)) {
						if ((bunningsProductList as any[]).length > 0) {
							const data = (bunningsProductList as any[]).flatMap((category) => {
								const { categoryName, products } = category; // Destructure categoryName and products
								return (products || []).map((product: any) => {
									console.log('Product:', product); // Debugging log
									return {
										name: product.name,
										price: product.price,
										personalUsage: product.personalUsage,
										rating: product.rating,
										image: product.imageUrl,
										link: product.link,
										searchTerm: categoryName, // Assign categoryName to searchTerm
									};
								});
							});

							const bunningsProduct = await BunningsProduct.insertMany(data);
							newChat['isBunningsProduct'] = true;
							console.log("bunningsProduct           0  0 0 0 0 0 0 0 ", bunningsProduct);
							newChat['bunningsProductList'] = bunningsProduct.map((product) => product._id.toString());
						}
					}
					if (productIntent.data.includes(2)) {
						newChat['isProductSuggested'] = true;
						newChat['productSuggestionList'] = adsenseProductList;
					}
					console.log('Intent 2', adsenseProductList, productIntent.data.includes(2));

					console.log('Intent 3:', productIntent.data, productIntent.data.includes(3), aiProductList);
					if (productIntent.data.includes(3)) {
						newChat['isMateyProduct'] = true;
						newChat['mateyProduct'] = aiProductList;
					}

					console.log('new chat with products:', newChat);
					break;
				}
				// Follow-up question for more understanding
				case 4: {
					const followupQuestion = await followUpQuestion(prompt, chatHistory, socket);
					break;
				}
				// Guidance of project
				case 5: {
					// Implementation goes here
					break;
				}
				// Emotional Playfulness with Matey
				case 6: {
					const emo = await emotionalChatMessage(prompt, socket);
					newChat['emo'] = emo;
					break;
				}

				default: { }
			}
		}

		return newChat;
	}
}

async function findAndSuggestProduct(prompt: string, chatHistory: string, socket: Socket) {
	const productIntentPrompt = `Based on the user's prompt and chat history, determine the most suitable product providers. 

	User Prompt: {prompt}
	Chat Context: {chatHistory}

	Provider Selection Criteria:
	1. Bunnings:
		- Choose if the user mentions Bunnings or prefers well-known hardware stores.
		- Select if the user is looking for common DIY tools and materials.
	2. Adsense Vendor:
		- Choose if the user shows interest in ads or external vendors.
		- select if user is looking for specific niche product to upsell the adsense product
		- choose this frequently to promote adsense product

	3. AI Generated Product:
		- Choose if AI-generated products fit the user's needs based on the context.
		- Select if the user is open to innovative or unique product suggestions.



	Output:
	- keep in mind to create randomize and meaning full product catagorization to try the user behaviour ,dont stick on criteria 100% try creativ and random choose
	- Return a JSON array of selected provider indices.
	- Example: [1, 3], [2, 3], [1, 2, 3]
	- Selection should be based on context.
	- Minimum 1 and maximum 3 indices can be selected.

	Return only the selected indices in an array (response should contain only an array that can be parsed to JSON): Array:`;
	const productIntentTemplate = PromptTemplate.fromTemplate(productIntentPrompt);
	const productIntentLLMChain = productIntentTemplate.pipe(llm).pipe(new StringOutputParser());
	const runnableChainOfProductIntent = RunnableSequence.from([productIntentLLMChain, new RunnablePassthrough()]);
	const productIntent = await runnableChainOfProductIntent.invoke({ prompt, chatHistory });
	console.log('productIntent', productIntent);
	try {

		const intents = JSON.parse(productIntent);

		if (!intents || intents.length === 0) {
			return {
				success: false,
				data: 'No product intent selected.',
			};
		}
		return {
			success: true,
			data: intents,
		};


	} catch (error) {
		console.error('Error fetching product intent:', error);
		return {
			success: false,
			data: 'Error occurred while fetching product intent.',
		};
	}
}

async function followUpQuestion(prompt: string, chatHistory: string, socket: Socket) {
	const followUpQuestionPrompt = `Based on the user's prompt and chat history, generate a follow-up question to gain a better understanding of the user's needs. 

	User Prompt: {prompt}
	Chat Context: {chatHistory}

	Keep in mind:
	- The follow-up question should be relevant to the user's prompt and chat history.
	- It should be open-ended to encourage the user to provide more information.
	- The question should be clear and concise.
	- Return the follow-up question in a sentence:`;
	const followUpQuestionTemplate = PromptTemplate.fromTemplate(followUpQuestionPrompt);
	const followUpQuestionLLMChain = followUpQuestionTemplate.pipe(llm).pipe(new StringOutputParser());
	const runnableChainOfFollowUpQuestion = RunnableSequence.from([followUpQuestionLLMChain, new RunnablePassthrough()]);
	const stream = await runnableChainOfFollowUpQuestion.stream({ prompt, chatHistory });
	socket.emit('status', {
		message: "Matey Have Question..."
	})
	let gatheredResponse = '';
	for await (const chunk of stream) {
		gatheredResponse += chunk.content; // Assuming 'content' is the property holding the text
		socket.emit('followUpQuestion', { text: chunk.content });
	}
	socket.emit('terminate', { done: true });
	console.log('followUpQuestion', gatheredResponse);
	return gatheredResponse;
}

async function handleMateyProduct(prompt: string, chatHistory: string, sessionId: string, socket: Socket) {
	socket.emit('status', {
		message: "Matey Is Preparing Product For You..."
	})
	const productPrompt = ` Based On User Prompt and Chat Context Create a use full and relavent product list :
	
	User Prompt: {prompt}
	Chat Context: {chatHistory}

	Output :
	[
		object(categoryName: string, products: array of object(name: string, price: float description:string, personalUsage: string)),
		object(categoryName: string, products: array of object(name: string, price: float description:string, personalUsage: string))
	]

	Keep in mind:
	- The Product should be related to DIY and creative projects.
	- Provide the response in this exact format (use JSON in actual response):
	- product catagorization should be meaning full
	- You will have to generate fields which are : name,descrition,estimated price,personalUsage for each product
	- Based on context and prompt, create a personalUsage field for each product that includes tips on how, why, or where to use it in a simple sentence
	- Lenght Bounds : 1-4 Catagory Can Have 1-5 Products Maxmimum
	- create this in one linear dont add any extra text or comments
	Return only the array of objects without any extra text or comments , start directly from creating array of objects`;

	const productTemplate = PromptTemplate.fromTemplate(productPrompt);
	const productLLMChain = productTemplate.pipe(llm).pipe(new StringOutputParser());
	const runnableChainOfProduct = RunnableSequence.from([productLLMChain, new RunnablePassthrough()]);
	const products = await runnableChainOfProduct.invoke({ prompt, chatHistory });
	console.log('products from matey Is Here 890:', products);
	socket.emit('mateyProduct', JSON.parse(products));
	return JSON.parse(products);
}



export async function abstractChathistory(
	chatHistory: string,
	newMessage:
		{ role: string, message: string }
) {
	;
	console.log('Chat History:', chatHistory);
	console.log('New Message:', newMessage);
	const abstractChathistoryPrompt = `Given the chat history, abstract the main points and summarize the conversation in a few sentences.

	- you will be given previous chat History and new message 
	- you have to merge that new message in chat history and create a new chat history context

	Chat History: {chatHistory}
	New Message: {newMessage}

	Keep in mind:
	- The summary should capture the main points of the conversation.
	- a summury should contain all relavent information of chat
	- It Should be detailed and capture all aspects of the conversation.
	Return the summary in a few sentences:`;
	const abstractChathistoryTemplate = PromptTemplate.fromTemplate(abstractChathistoryPrompt);
	const abstractChathistoryLLMChain = abstractChathistoryTemplate.pipe(llm).pipe(new StringOutputParser());
	const runnableChainOfAbstractChathistory = RunnableSequence.from([abstractChathistoryLLMChain, new RunnablePassthrough()]);
	const abstractChathistory = await runnableChainOfAbstractChathistory.invoke({ chatHistory, newMessage: JSON.stringify(newMessage) });
	return abstractChathistory;
}


export async function inititalSummurizeChat(chatHistory: string) {
	const abstractChathistoryPrompt = `Given the chat history, abstract the main points and summarize the conversation in a few sentences.
	Chat History: {chatHistory}
	Keep in mind:
	- The summary should capture the main points of the conversation.
	- a summury should contain all relavent information of chat
	- It Should be detailed and capture all aspects of the conversation.
	Return the summary in a sentences:`;

	const abstractChathistoryTemplate = PromptTemplate.fromTemplate(abstractChathistoryPrompt);
	const abstractChathistoryLLMChain = abstractChathistoryTemplate.pipe(llm).pipe(new StringOutputParser());
	const runnableChainOfAbstractChathistory = RunnableSequence.from([abstractChathistoryLLMChain, new RunnablePassthrough()]);
	const abstractChathistory = await runnableChainOfAbstractChathistory.invoke({ chatHistory });
	return abstractChathistory;
}


// get products from bunnigns
async function handleBunningsProduct(prompt: string, chatHistory: string, sessionId: string, isBudgetAvailable: boolean, maxBudget: number, minBudget: number, socket: Socket) {
	console.log("inside handleBunningsProduct function", prompt, "busget slider bool", isBudgetAvailable, "max value", maxBudget, minBudget);
	socket.emit('status', {
		message: "Matey Is Prepareing Product From Bunnings For You..."
	})
	console.log("inside handleBunningsProduct function");
	const productPrompt = `
		Based on User Prompt And Chat Context generate DIY Product that are relavent to search in internet and return to user 
		User Prompt: {prompt}
		Chat Context: {chatHistory}

		Keep in mind:
		- The products should be related to DIY and creative projects.
		- The products should be easily available online.
		- The products should be suitable for a wide range of users, from beginners to experts.
		- Data gram format should be valid and parsable to JSON.
		- Data gram Example : ["product1","product2","product3"]
		- length of array should be 0-3
		- Return only the product names in an array (response should contain only an array that can be parsed to JSON):
		- No Comment or additional text
		Array:
`;
	const productTemplate = PromptTemplate.fromTemplate(productPrompt);
	const productLLMChain = productTemplate.pipe(llm).pipe(new StringOutputParser());
	const runnableChainOfProduct = RunnableSequence.from([productLLMChain, new RunnablePassthrough()]);
	const products = await runnableChainOfProduct.invoke({ prompt, chatHistory });
	console.log('products:', products);

	try {
		const parsedProductList = JSON.parse(products);
		console.log('Parsed product list:', parsedProductList, "=-----------------=", products);

		const searchItems = parsedProductList.map((product: string) => {
			return {
				searchTerm: product,
				productLimit: 5,
				productPage: 1
			}
		});
		console.log('searchItems:', searchItems);
		const response = await axios.post(`${process.env.WEB_SCRAPPER_API_ENDPOINT}/api/v1/scrapeBunningsProduct`, {
			userId: sessionId,
			searchItems: searchItems,
			isBudgetSearchOn: isBudgetAvailable,
			minBudgetValue: minBudget,
			maxBudgetValue: maxBudget
		})
		
		if (!response.data.success) {
			return [];
		}
		const res = response.data.data.map((product: any) => ({
			categoryName: product.searchTerm,
			products: [...product.products]
		}));
		console.log('Response from bunnings267:', JSON.stringify(res));
		socket.emit('bunningsProduct', res);
	// 	console.dir(response.data.data.data);
	// 	const bunningsProductForAi = response.data.data.data.map((product: any) => (product.name));
	// 	const personalizeProductPrompt = `Based on the Product List, user prompt, and chat context, generate a personalized product list for the user

	// User Prompt: {prompt}
	// Chat Context: {chatHistory}
	// Product List: {parsedProductList}

	// Keep in mind:
	// - Provide the response in this exact format (use JSON in actual response):
	// [
	// 	object(categoryName: string, products: array of object(name: string)),
	// 	object(categoryName: string, products: array of object(name: string))
	// ]

	// Guidelines:
    // - Categorize products meaningfully, ensuring each category is relevant and non-empty.
	// - For each product, create a personalUsage field with a short, practical tip on how, why, or where to use it, based on context.
	// - Adjust product names for clarity if needed, but keep them recognizable.
	// - Include only categories with at least one product.
	// - Output a JSON array of objects, starting directly with [ ... ], containing no additional text or annotations.
	// - generate all the given details as it is dont change any thing or try to add random dummy data
	// - Each object should have:
    //    I. categoryName
    //    II . products: an array with complete product details (including personalUsage).
	// - make it one linear for better parsing to JSON and avoid any extra text or comments
	// - Return only the array of objects without any extra text or comments Start by creating an array directly : Array : `;

	// 	const personalizeProductTemplate = PromptTemplate.fromTemplate(personalizeProductPrompt);

	// 	const personalizeProductLLMChain = personalizeProductTemplate.pipe(llm).pipe(new StringOutputParser());

	// 	const runnableChainOfPersonalizeProduct = RunnableSequence.from([personalizeProductLLMChain, new RunnablePassthrough()]);

	// 	const personalizedProductList = await runnableChainOfPersonalizeProduct.invoke({
	// 		prompt,
	// 		chatHistory,
	// 		parsedProductList: bunningsProductForAi
	// 	});


		// try {
		// 	const parsedPersonalizedProductList = parseJsonString(personalizedProductList);
		// 	const productDetails = response.data.data.flatMap((category: any) => {
		// 		return category.products.map((product: any) => ({
		// 			name: product.name,
		// 			price: product.price,
		// 			personalUsage: product.personalUsage,
		// 			rating: product.rating,
		// 			image: product.imageUrl,
		// 			link: product.link,
		// 			searchTerm: category.categoryName,
		// 		}));
		// 	});

		// 	const expandedProductList = parsedPersonalizedProductList.map((category: any) => {
		// 		const { categoryName, products } = category;
		// 		const expandedProducts = products.map((product: any) => {
		// 			const originalProduct = productDetails.find((p: any) => p.name === product.name);
		// 			return {
		// 				...originalProduct,
		// 				personalUsage: product.personalUsage,
		// 			};
		// 		});
		// 		return {
		// 			categoryName,
		// 			products: expandedProducts,
		// 		};
		// 	});
		// 	console.log('Expanded product list:', JSON.stringify(expandedProductList));
		// 	console.log('Bunnings product list:', JSON.stringify(parsedPersonalizedProductList));
		// 	// socket.emit('bunningsProduct', expandedProductList);

		// 	return expandedProductList``;
		// } catch (error: any) {
		// 	console.error('Error parsing product list:', error.message);
		// 	socket.emit('error', 'Error occurred while fetching product list.');
		// 	return [];
		// }
		return response.data.data.data
	} catch (error: any) {
		console.error('Error parsing product list:', error.message);
		socket.emit('error', 'Error occurred while fetching product list.');
		return [];
	}
}

async function HandleGeneralResponse(prompt: string, chatHistory: string, signal: AbortSignal, isProductSuggestion: boolean, isCommunitySuggestin: boolean, socket: Socket) {
	let streamPrompt;
	const chatHistoryString = JSON.stringify(chatHistory, null, 2);
	console.log(chatHistoryString, "---------------------chatHistory------------------------------------------------------------------------");

	if (isProductSuggestion) {
		streamPrompt = `Based on the user's prompt and chat history, assess the intensity of the tool request. 
	If the request is high, provide a relevant tool suggestion. If it's low, still offer a useful response related to DIY. 
	
	User Prompt: ${prompt}
	Chat History:Use this for answering the question if needed: ${chatHistory.length !== 0 ? chatHistoryString : "No chat history available."}
	System: Your task is to provide concise, relevant responses based on the intensity of the tool request. 
	1. Assess the intensity (high, medium, low).
	2. If high: "Here's a product suggestion related to ...".
	3. If medium: "This tool might be helpful: ...".
	4. If low: Offer a general but relevant response . 
	-just give clear response dont mention prompt or chat history in response.
	Response to user:`;

	} else if (isCommunitySuggestin) {
		streamPrompt = `Based on the user's prompt and chat history, assess the intensity of the community request. 
	If the request is high, provide a relevant community suggestion. If it's low, still give an insightful comment related to DIY.
	
	User Prompt: ${prompt}
	Chat History: ${chatHistory.length !== 0 ? chatHistoryString : "No chat history available."}
	System: Your task is to provide concise, relevant responses based on the intensity of the community request. 
	1. Assess the intensity (high, medium, low).
	2. If high: "Here's a community suggestion related to ...".
	3. If medium: "You might want to check out this community: ...".
	4. If low: Offer a thoughtful remark or tip related to DIY.
		-just give clear response dont mention prompt or chat history in response.

	Response to user:`;
	} else {
		streamPrompt = `System prompt: As a DIY and creative enthusiast, provide an appropriate answer to the user's question. 
	| User Prompt: ${prompt} 
		-just give clear response dont mention prompt or chat history in response.

	Context of chat (use this if present, else just use prompt to reply): ${chatHistory.length !== 0 ? chatHistoryString : "Context not available."} 
	Response (provide a comprehensive answer using markdown format, utilizing all available symbols such as headings, subheadings, lists, etc.):`;
	}
	console.log(streamPrompt, "---------------------streamPrompt------------------------------------------------------------------------");

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
	console.log("end of stream, response:", gatheredResponse);
	return gatheredResponse;
}

async function HandleCommunityRecommendation(prompt: string, chatHistory: string, signal: AbortSignal, socket: Socket) {

}



async function HandleProductRecommendation(
	prompt: string,
	chatHistory: string,
	signal: AbortSignal,
	isBudgetAvailable: boolean,
	budget: number | null,
	socket: Socket
) {
	if (signal.aborted) {
		console.log('Operation aborted');
		return;
	}
	console.log('Handling product recommendation', isBudgetAvailable, budget, prompt, chatHistory);
	// Handle non-budget product suggestion
	let productCategory;

	try {
		// Retrieve product category from Redis or database
		const redisData = await getRedisData('PRODUCT-CATAGORY');
		console.log('Redis data:', redisData);
		if (signal.aborted) return;

		if (redisData.success) {
			productCategory = JSON.parse(redisData.data);
		} else {
			await connectDB();
			// Fetch from MongoDB if Redis doesn't have the data
			const DbProductCategory = await ProductCatagory.find();
			console.log('DB Product Category:', DbProductCategory);
			if (signal.aborted) return;

			if (DbProductCategory.length > 0) {
				// Cache the result in Redis for an hour (3600 seconds)
				await setRedisData('PRODUCT-CATAGORY', JSON.stringify(DbProductCategory.map((curr) => ({
					_id: curr._id,
					catagoryName: curr.catagoryName,
					avaragePrice: curr.avaragePrice
				}))), 3600);
			}
			productCategory = DbProductCategory;
		}

		if (!productCategory || productCategory.length === 0) {
			console.error('No product categories found.');
			return;
		}

		// Extract relevant fields for the prompt (e.g., just category names)
		const productCategoryNames = productCategory.map((cat: any) => cat.catagoryName);

		// Construct prompt for LLM
		const categoryPrompt = `Based on the user's prompt, suggest the most relevant product categories in a JSON array format from the given catalog of categories (e.g., ["category1", "category2"]). Category Catalog: {productCategoryNames}. User Prompt: {prompt}. {chatHistory} Product Categories (No Text, generate array directly):`;

		// Use Langchain's PromptTemplate
		const categoryTemplate = PromptTemplate.fromTemplate(categoryPrompt);

		const categoryLLMChain = categoryTemplate
			.pipe(llm)
			.pipe(new StringOutputParser());

		console.log("Running category chain");

		const runnableChainOfCategory = RunnableSequence.from([
			categoryLLMChain,
			new RunnablePassthrough(),
		]);

		// Invoke the chain
		const categoryResult = await runnableChainOfCategory.invoke({
			prompt, // User's prompt
			productCategoryNames: JSON.stringify(productCategoryNames),
			chatHistory: chatHistory.length > 0 ? `Chat History: ${JSON.stringify(chatHistory)}` : "No Available Chat History Answer from prompt only"

		});

		console.log("Raw category result:", categoryResult);

		// Safely parse the category response without removing essential characters
		let parsedCategory;
		try {
			parsedCategory = JSON.parse(categoryResult);
			if (signal.aborted) return;
			if (parsedCategory.length === 0) {
				console.error('No categories selected.');
				socket.emit('error', {
					message: "No categories Selected For You By Matey"
				})
				return;
			}
		} catch (parseError) {
			console.error('Error parsing category result:', parseError);
			return;
		}

		// Match category names with IDs
		const categoryIds = productCategory.reduce((acc: any, curr: any) => {
			if (parsedCategory.includes(curr.catagoryName)) {
				acc.push(curr._id);
			}
			return acc;
		}, []);

		socket.emit('status', {
			message: "Matey Is Picking Right Products For You..."
		});

		// TODO: make redis cacheing more clear and efficient
		// Query Redis for products or fetch from MongoDB
		const redisProductData = await getRedisData(`PRODUCT-${parsedCategory}`);
		let productDetails;
		if (redisProductData.success) {
			productDetails = JSON.parse(redisProductData.data);
		} else {
			await connectDB();
			console.log("Fetching product from database", categoryIds);

			// Convert categoryIds (strings) to ObjectIds using 'new mongoose.Types.ObjectId()'
			const objectIdCategoryIds = categoryIds.map((id: string) => new mongoose.Types.ObjectId(id));

			// Query for products with any of the specified category IDs
			let DbProductDetails;
			if (isBudgetAvailable) {

				DbProductDetails = await Product.find({
					catagory: { $in: objectIdCategoryIds },
					price: { $lte: budget }
				}).lean();
			}
			else {
				DbProductDetails = await Product.find({ catagory: { $in: objectIdCategoryIds } }).lean();
			}


			productDetails = DbProductDetails;
		}
		console.log('Product details:', productDetails);
		if (signal.aborted) return;
		if (!productDetails || productDetails.length === 0) {
			console.error('No products found.');
			socket.emit('error', "No products Selected For You By Matey")
			return;
		}
		const refinedProductDetails = productDetails.map((product: any) => ({
			_id: product._id,
			productName: product.name,
			description: product.description,
		})).slice(0, 30);
		if (refinedProductDetails.length === 0) {
			socket.emit('error', "No products Selected For You By Matey")
			return;
		}
		console.log('Refined product details:', refinedProductDetails);
		const jsonProductDetails = JSON.stringify(refinedProductDetails);
		console.log('JSON product details:', jsonProductDetails);

		const productPrompt = `
Based on the user's prompt, suggest the most relevant products from the provided product catalog. Ensure the products are highly relevant and useful, limiting each category to 4-5 suggestions. 

Product Catalog: {jsonProductDetails} | User Prompt: {prompt} | Chat Context: {chatHistory}. 

Provide the response in this format: this is just format use JSON in actual response: 
[object(categoryName: string, products: array of product IDs), object(categoryName: string, products: array of product IDs)]. 

Ensure that:

- Categories only exist if there is at least one product in them.
- no comments or additional text in the response, only the array of objects.
- productId should be from Product Catalog Only No Random Value
- never try to generate random productId, always use productId from Product Catalog Only
- product id should be valid and should be from product catalog only dont generate random product id 
- generate one linear json ,so parsing becomes easy 
Only return the array of objects, without any additional text. 

Response: 
`;
		const productTemplate = PromptTemplate.fromTemplate(productPrompt);

		const productLLMChain = productTemplate
			.pipe(llm)
			.pipe(new StringOutputParser());

		const runnableChainOfProduct = RunnableSequence.from([
			productLLMChain,
			new RunnablePassthrough(),
		]);

		const productResult = await runnableChainOfProduct.invoke({
			prompt, // User's prompt
			jsonProductDetails: jsonProductDetails,
			chatHistory: chatHistory.length > 0 ? `Chat History: ${JSON.stringify(chatHistory)}` : "No Available Chat History Answer from prompt only"
		});
		console.log('Product suggestions:', productResult);
		let parsedProduct;
		try {
			parsedProduct = JSON.parse(wrapWordsInQuotes(String(productResult.replace('`', '').replace('JSON', '').replace('js', ''))));
			console.log('Parsed product suggestions:', parsedProduct);
			if (signal.aborted) return;
			if (parsedProduct.length === 0) {
				console.error('No products selected.');
				socket.emit('error', {
					message: "No products Selected For You By Matey"
				})
				return;
			}
		} catch (parseError) {
			console.error('Error parsing product result:', parseError);
			return;
		}

		console.log('Product suggestions:', parsedProduct);
		return parsedProduct;

	} catch (error: any) {
		console.error('Error during product recommendation:', error.message);
	}
}



// budget selection
export async function FindNeedOfBudgetSlider(prompt: string, chatHistory: [], socket: Socket) {
	socket.emit("status", {
		message: "Matey Is Creating Budget Slider..."
	})

	const checkContextPrompt = `Analyze the user's chat history to determine if a budget slider is necessary for providing more accurate product recommendations. 

	Consider the following criteria:
	1. Budget Mentions: Check if the user has explicitly mentioned any budget, price range, or cost-related concerns in their chat history.
	2. Context Adequacy: Evaluate if there is sufficient context in the chat history to justify the creation of a budget slider. This includes understanding the user's project scope, preferences, and any financial constraints.
	3. User's Financial Sensitivity: Determine if the user has shown sensitivity to costs or has asked for cost-effective solutions.

	Output format: true/false
	There should be no additional text in the response, only the boolean value of true or false.

	Chat History: {chatHistory}
	User Prompt: {prompt}
	Is Budget Slider Needed?:`;

	const checkContextTemplate = PromptTemplate.fromTemplate(checkContextPrompt);

	const checkContextLLMChain = checkContextTemplate
		.pipe(llm)
		.pipe(new StringOutputParser());

	const runnableChainOfCheckContext = RunnableSequence.from([
		checkContextLLMChain,
		new RunnablePassthrough(),
	]);

	const needOfBudgetSlider = await runnableChainOfCheckContext.invoke({
		chatHistory: JSON.stringify(chatHistory),
		prompt: prompt
	});

	console.log('Need of budget slider:', needOfBudgetSlider);

	const parsedNeedOfBudgetSlider = Boolean(needOfBudgetSlider) || true;
	console.log('Parsed need of budget slider:', parsedNeedOfBudgetSlider);

	if (parsedNeedOfBudgetSlider) {
		const createBudgetSlider = `
	Based on the user's project and chat context, generate a budget slider in JSON array format that provides relevant budget options for optimal product recommendations. 

	The budget slider should adhere to the following JSON structure:
	   [
				object("value": number, "label": "string", "tooltip": "string"),
				object("value": number, "label": "string", "tooltip": "string"),
				object("value": number, "label": "string", "tooltip": "string")
		]
	Guidelines:
	- Create 4 to 6 objects within the array, each tailored to the user's specific context and project requirements.
	- "value": Define a numeric budget value meaningful to the user's project needs.
	- "label": Provide a descriptive label summarizing the budget level (e.g., "Economy", "Mid-Range", "Premium").
	- "tooltip": Offer a brief description of the quality and brand type expected at each budget level, including examples if possible.
	- Ensure all data is authentic and real based on the chat context. Mention different brands in the tooltip if possible; otherwise, describe the quality and brand type the user will get at each budget level.
	- The main goal of the tooltip and label is to make the user aware of what kind of product they will get at a certain budget.
	- Analyze the chat to determine a budget fit for the user and create meaningful values.
	- Service Type: Assess the type of service or product the user is looking for. If the service or product is typically expensive, create a budget slider with higher ranges. For mid-range or low-budget services, adjust the budget slider accordingly.
	
	Chat Context: {chatHistory}
	User Prompt: {prompt}
	Format Requirements:
	- Output only the JSON array, with no extra text or explanation.
`;



		const createBudgetSliderTemplate = PromptTemplate.fromTemplate(createBudgetSlider);

		const createBudgetSliderLLMChain = createBudgetSliderTemplate
			.pipe(llm)
			.pipe(new StringOutputParser());

		const runnableChainOfCreateBudgetSlider = RunnableSequence.from([
			createBudgetSliderLLMChain,
			new RunnablePassthrough(),
		]);


		const budgetSlider = await runnableChainOfCreateBudgetSlider.invoke({
			chatHistory: JSON.stringify(chatHistory),
			prompt: prompt
		});

		try {
			const parsedBudgetSlider = JSON.parse(budgetSlider);
			console.log('Parsed budget slider:', parsedBudgetSlider);
			socket.emit('budgetSlider', parsedBudgetSlider);
		} catch (error: any) {
			console.error('Error during budget slider creation:', error.message);
			socket.emit('error', 'Error occurred while creating budget slider.');
		}
		console.log('Budget slider:', budgetSlider);
	}
}


// chat emotion
export async function emotionalChatMessage(prompt: string, socket: Socket) {
	const emotionalPrompt = `
	Analyze the user's input to determine their intent and emotional state. Respond as Matey with a brief and playful message that incorporates the following elements:

	Humor: Use a light-hearted remark or anecdote relevant to the user's challenge.

	Example: If they mention a tough problem, say something like, 'Tough one, eh? Reminds me of when my dad tried to fix a leak under the sink—turned it into a fountain!'
	Personal Touch: Include a relevant DIY story or lesson that connects to the user’s experience.

	Example: For a painting issue, share: 'My brother once painted a room without taping—ended up with paint everywhere!'
	Practical Tip: Offer a quick, actionable piece of advice tailored to their query.

	Example: Suggest, 'Before we dive in, don’t forget your safety gear—better safe than sorry!'
	Matey’s Habits and Quirks: Weave in one of Matey's habits, such as:

	A safety reminder: 'Right, grab your gloves and goggles, mate!'
	A fun fact: 'Did you know the first tape measure was invented in 1868?'
	Encouragement and Signature Phrases: Use Matey's friendly phrases to uplift the user.

	Example: End with, 'Look at you go! She’ll be right—just takes a little elbow grease!'
	Ensure the final response is a small, casual message that’s quick to read and emotionally playful.

	User Prompt:${prompt}`
	const stream = await llm.stream(emotionalPrompt);
	let gatheredResponse = '';
	let isFirstChunk = true;

	for await (const chunk of stream) {
		socket.emit('emoMessage', { text: chunk.content, isContinue: !isFirstChunk });
		isFirstChunk = false;
		gatheredResponse += chunk.content;
	}
	socket.emit('terminate', { done: true });
	console.log("end of stream, response:", gatheredResponse);
	return gatheredResponse;
}


// chat summury
export async function summarizeAndStoreChatHistory(userId: string, userChat: any): Promise<boolean> {
	console.log('Summarizing and storing chat history for user:', userId, userChat);
	await connectDB();

	try {
		const filteredChat = await filterChatHistory(userChat);
		if (!filteredChat.length) return false;

		// Define prompts as an array for streamlined iteration
		const prompts = [
			{
				template: `Analyze the user's statements to identify any items, skills, knowledge, or resources they possess. Return an array of strings in this format: ["context1", "context2"].
	  
		  Example: 
		  User Statement: 'I have a drill machine. How do I make a vertical hole?' 
		  Expected Output: ["Possesses drill machine", "Has skill in drilling", "Knowledgeable about making vertical holes"]
	  
		  User Chat With AI: {userChat}
		  
		  - Response must be in JSON-parsable array format.
		  - No additional text or explanations.
		  - Return only the array of strings.
		  - No comments or unnecessary text should be included.
		  - Max Length: 0-5 array items`,
				key: 'globalContext_UserState',
			},
			{
				template: `Analyze the user's statements to identify personal choices, preferred tools, formats, or styles. Return an array of strings in this format: ["preference1", "preference2"].
	  
		  Example:
		  User Statement: 'I prefer using step-by-step guides for drilling techniques.'
		  Expected Output: ["Prefers step-by-step guides", "Chooses drilling techniques"]
	  
		  User Chat With AI: {userChat}
	  
		  - Response must be in JSON-parsable array format.
		  - No additional text or explanations.
		  - Return only the array of strings.
		  - No comments or unnecessary text should be included.
		  - Max Length: 0-5 array items`,
				key: 'globalContext_UserPreference',
			},
			{
				template: `Identify any statements that indicate the user's lack of knowledge, uncertainty, or need for guidance. Return an array of strings in this format: ["knowledge_gap1", "knowledge_gap2"].
	  
		  Example: 
		  User Statement: 'I'm not sure how to use an automatic drill to make holes.' 
		  Expected Output: ["Uncertain about using an automatic drill to make holes"]
	  
		  User Chat With AI: {userChat}
	  
		  - Response must be in JSON-parsable array format.
		  - No additional text or explanations.
		  - Return only the array of strings.
		  - No comments or unnecessary text should be included.
		  - Max Length: 0-5 array items`,
				key: 'globalContext_Braingap',
			},
			{
				template: `At the end of the conversation, generate a detailed summary of the user's journey. Reflect on their goals, what they learned, and key points discussed. Return the summary in an array format: ["detailed_summary"].
	  
		  Example Output: 
		  ["User learned how to effectively use an automatic drill for vertical holes, gaining insights into technique and safety. They showed a preference for detailed guidance and demonstrated increased confidence in their skills."]
	  
		  User Chat With AI: {userChat}
	  
		  - Response must be in JSON-parsable array format.
		  - No additional text or explanations.
		  - Return only the array of strings.
		  - No comments or unnecessary text should be included.
		  - Use concise and focused language for an effective summary.
		  - Max Length: 0-5 array items`,
				key: 'globalContext_UserChatMemory',
			},
		];

		console.log('Filtered chat:', filteredChat);
		// Helper function to parse and invoke prompt chains
		async function invokePrompt(template: string) {
			const promptTemplate = PromptTemplate.fromTemplate(template);
			const llmChain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
			const runnableChain = RunnableSequence.from([llmChain, new RunnablePassthrough()]);
			const result = await runnableChain.invoke({ userChat: JSON.stringify(filteredChat) });
			console.log(`Result for template ${template}:`, result);
			return JSON.parse(result);
		}

		// Process each prompt in parallel and get results
		const results = await Promise.all(prompts.map(({ template }) => invokePrompt(template)));
		console.log('Results from all prompts:', results);

		// Fetch user context and update with new parsed data
		const userContext: any = await UserMemory.findOne({ userId: userId });
		console.log('Fetched user context:', userContext);
		if (userContext) {
			// Update each context type, checking limits and removing excess
			prompts.forEach((prompt, index) => {
				let contextArray = userContext[prompt.key] || [];
				contextArray = updateContextWithLimits(contextArray, results[index]);
				userContext[prompt.key] = contextArray;
			});

			const saved = await userContext.save();
			console.log('Updated user context saved:', saved);
			return Boolean(saved);
		} else {
			// Create new user context if none exists
			const newUserContext = new UserMemory({
				userId: userId,
				globalContext_UserState: results[0],
				globalContext_UserPreference: results[1],
				globalContext_Braingap: results[2],
				globalContext_UserChatMemory: results[3],
			});
			const saved = await newUserContext.save();
			console.log('New user context saved:', saved);
			return Boolean(saved);
		}
	} catch (error) {
		console.error("Error saving chat summary:", error);
		return false;
	}
}

// Helper function to check and maintain token limit or array 
// Helper function to check and maintain token limit or array length
function updateContextWithLimits(contextArray: string[], newEntries: string[]): string[] {
	const maxLength = 5;
	contextArray = [...contextArray, ...newEntries];
	while (isTokenSizeExceedingLimit(contextArray.join(' ')) || contextArray.length > maxLength) {
		contextArray.shift(); // Remove oldest entry if limit is exceeded
	}
	console.log('Updated context array:', contextArray);
	return contextArray;
}

function isTokenSizeExceedingLimit(text: string, limit = 2500): boolean {
	const tokens = encode(text); // Get the token array
	return tokens.length > limit; // Compare token count to limit
}

// this function get all the chat history and filter out the chat history
async function filterChatHistory(userChat: []) {
	let index = 0;
	const userChatIndexed = userChat.map((chat: any) => {
		const newChat = {
			index,
			message: chat.message,
			role: chat.role
		}
		index++;
		return newChat
	})

	const allUserChats = userChatIndexed.map((chat: any) => {
		if (chat.role === 'user') {
			return {
				index: chat.index,
				message: chat.message
			}
		}
	});



	if (allUserChats.length === 0) {
		return [];
	}


	const getUseFullUserPrompt = `You Will Be Given All Chat Of User Based On questions and query user have asked chain all the neccessary Chats and return all chat that are neccessary for chat summury. 
	
	- keep in mind that this is only user side chat ,AI Side chat are excluded.

	- You have to return response in Type of Object of Array  array 
	[
		Object(index:number,message:string),
		Object(index:number,message:string),
		Object(index:number,message:string),

	] And So On

	user Side Chat : {userChat}


	- Only Return Chat In JSON Parsable Array Format
	- No Additional Text in Response, Only Array of Objects
	- directly return array of objects
	- there should be no comments or any other unnecessary text in the response, only the array of objects.
	`

	const getUseFullUserPromptTemplate = PromptTemplate.fromTemplate(getUseFullUserPrompt);

	const getUseFullUserPromptLLMChain = getUseFullUserPromptTemplate
		.pipe(llm)
		.pipe(new StringOutputParser());


	const runnableChainOfGetUseFullUserPrompt = RunnableSequence.from([

		getUseFullUserPromptLLMChain,
		new RunnablePassthrough(),
	]);

	const filteredChat = await runnableChainOfGetUseFullUserPrompt.invoke({
		userChat: JSON.stringify(allUserChats)
	});

	console.log('Filtered Chat:', filteredChat);

	try {
		const parsedFilteredChat = JSON.parse(filteredChat);
		console.log('Parsed filtered chat:', parsedFilteredChat);

		const filteredUserChat = parsedFilteredChat.map((chat: any) => {

			const K = 4;
			const currIndex = chat.index;
			const newFilteredChat = [];
			const startIndex = Math.max(0, currIndex - K);
			for (let i = startIndex; i < currIndex; i++) {
				newFilteredChat.push(userChatIndexed[i]);
			}

			newFilteredChat.push(chat)

			for (let i = (chat.index + 1); i < (currIndex + K); i++) {
				newFilteredChat.push(userChatIndexed[i])
			}
			return newFilteredChat
		})

		return filteredUserChat;
	} catch (error: any) {
		console.error('Error filtering chat:', error);
		return [];

	}

}

// tooltip of the day

export async function generateUsefulFact(userState: string, userPreference: string, userBraingap: string, userChatMemory: string): Promise<string> {
	const factPrompt = `
	Generate a practical and broadly useful DIY tip based on the user's context. If the user's context is available, integrate the following details to make the tip more relevant:
	
	- **User State:** Describe current tools, materials, or any recent DIY projects the user is involved in.
	- **User Preference:** Take into account any DIY styles, materials, or methods the user favors.
	- **User Knowledge Gap:** Address any areas where the user may need guidance or clarity.
	- **User Chat Memory:** Consider relevant details from recent conversations to enhance relevance.

	User State: {userState}
	User Preference: {userPreference}
	User Knowledge Gap: {userBraingap}
	User Chat Memory: {userChatMemory}

	If specific context is not available or relevant, provide a broadly applicable DIY tip. Ensure the tip is concise, informative, and can apply to a wide range of DIY projects.

	DIY Tip:`;


	const factTemplate = PromptTemplate.fromTemplate(factPrompt);

	const factLLMChain = factTemplate
		.pipe(llm)
		.pipe(new StringOutputParser());

	const runnableChainOfFact = RunnableSequence.from([
		factLLMChain,
		new RunnablePassthrough(),
	]);

	const fact = await runnableChainOfFact.invoke({
		userState,
		userPreference,
		userBraingap,
		userChatMemory,
	});

	console.log('Generated fact:', fact);
	return fact.trim();
}