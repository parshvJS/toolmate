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
import { getPremiumUserChatMessage, wrapWordsInQuotes } from '../../utils/utilsFunction.js';
import { tool } from "@langchain/core/tools";
import { tools } from './tools.js';
import { getRedisData, setRedisData } from '../redis.js';
import ProductCatagory from '../../models/productCatagory.model.js';
import Product from '../../models/adsense/product.model.js';
import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import UserMemory from '../../models/userMemory.model.js';
import { encode } from 'gpt-tokenizer';

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


export async function getUserIntend(prompt: string, chatHistory: string, plan: number): Promise<number[]> {
	let getIntendPrompt = '';

	if (plan === 1) {
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
	
	**Chat History**: ${chatHistory}
	**User Prompt**: ${prompt}
	
	Your task is to synthesize the information from the user's prompt and chat history to determine their intent from the list above. 
	- Weigh the relevance of each intent based on the context and user cues.
	- Return only the selected intent numbers in an array (response should contain only an array that can be parsed to JSON): Array:`;
	}
	else if (plan === 2) {
		getIntendPrompt = `
	Based on the user's prompt and chat history, analyze the context to select the most relevant intents from the list below. Return only the corresponding numbers in a JSON-parsable array format (e.g., [2, 3]):
	
	2. Community recommendation (suggest if the user expresses difficulty or seeks peer support)
	3. Product recommendation (prioritize if the user's prompt indicates a need for a tool or resource)
	4. Follow-up question for more understanding (use this if the prompt is vague or needs clarification)
	5. Guidance on the project (select this if the user is asking for advice or direction)
	
	User Intent Analysis:
	1. Evaluate the user's mood and urgency: Does the user sound frustrated, confused, or uncertain? If so, lean towards community recommendations or guidance.
	2. Assess previous interactions: What have they discussed recently? If they mentioned a specific tool or project, prioritize product recommendations related to that.
	3. Look for specific keywords in the user prompt: Keywords like "help," "recommend," "need," or "advice" can guide intent selection.
	4. Consider the user's experience level: If the user is a beginner, focus more on guidance and community resources; if they're advanced, product recommendations might be more appropriate.
	
	**Chat History**: ${chatHistory}
	**User Prompt**: ${prompt}
	
	Your task is to synthesize the information from the user's prompt and chat history to determine their intent from the list above. 
	- Weigh the relevance of each intent based on the context and user cues.
	- Return only the selected intent numbers in an array (response should contain only an array that can be parsed to JSON): Array:`;
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
	
	**Chat History**: ${chatHistory}
	**User Prompt**: ${prompt}
	
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
	const userIntend = await runnableChainOfIntend.invoke({ prompt });

	// Parse and clean up the output
	let intentArray;
	try {
		intentArray= JSON.parse(userIntend.trim());
	} catch (error:any) {
		console.error('Error parsing user intent:', error.message);
		intentArray = [5];
		
	}

	// Ensure intent 1 is always present
	intentArray = [1, ...intentArray];

	console.log('user intend:', intentArray);
	return intentArray;
}

// intend list and user Id
export async function executeIntend(prompt: string, chatHistory: string, sessionId: string, intend: number[], userId: string, plan: number, signal: AbortSignal, isBudgetSliderValue: boolean, budgetSliderValue: number, socket: Socket) {

	var newChat = {
		sessionId: userId,
		role: 'ai',
		message: '',
		isProductSuggested: false,
		isCommunitySuggested: false,
		communityId: [],
		productId: []
	};
	// TODO: Remove this below condition and code all features for pro plan currently plan 2
	if (plan == 1 || plan == 2) {
		for (let i = 0; i < intend.length; i++) {
			switch (intend[i]) {
				// general response
				case 1: {
					socket.emit('status', {
						message: "Matey Is Typing..."
					})
					const generalResponse = await HandleGeneralResponse(prompt, chatHistory, signal, intend.includes(3), intend.includes(2), socket);
					newChat['message'] = generalResponse;
					break;
				}
				// community recommendation
				case 2: {
					socket.emit('status', {
						message: "Matey Is Finding Community For You..."
					})
					newChat['isCommunitySuggested'] = true;
					const communityId = await HandleCommunityRecommendation(prompt, chatHistory, signal, socket);
					break;
				}
				// product recommendation
				case 3: {
					socket.emit('status', {
						message: "Matey Is Finding Product For You..."
					})
					const productId = await HandleProductRecommendation(prompt, chatHistory, signal, isBudgetSliderValue, budgetSliderValue, socket);
					if (!productId) {
						socket.emit('noProducts', {
							message: "No products found."
						})
						continue;
					}
					newChat['isProductSuggested'] = true;
					newChat['productId'] = productId;
					socket.emit('productId', {
						productId: productId
					});
					console.log('Product ID:-------------------------------', productId);
					break;
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
		return newChat;

	}
}


async function HandleGeneralResponse(prompt: string, chatHistory: string, signal: AbortSignal, isProductSuggestion: boolean, isCommunitySuggestin: boolean, socket: Socket) {
	socket.emit('status', {
		message: "Matey Is Typing..."
	})
	let streamPrompt;
	if (isProductSuggestion) {
		streamPrompt = `Based on the user's prompt and chat history, determine the intensity of the tool request. If the request for tools is high, provide a brief response referring to the relevant tool. Tools include:
		1. Product
		2. Community suggestions
	
		User Prompt: ${prompt}
		Chat History: ${chatHistory.length !== 0 ? JSON.stringify(chatHistory) : "No available chat history procide without chat history"}
		system : Your job is to give concise response to user as per the intensity of the tool request.
		Your task is to:
		1. Assess the intensity of the tool request.
		2. If the intensity is high, generate a concise response referring to the relevant tool (e.g., "Here is a product suggestion related to ...", "Here is a community suggestion related to ..." etc.). then create dynamic response based on the intensity.
		3. If the intensity is low, proceed with a normal response.
	
		Response to user:`;
	}
	else if (isCommunitySuggestin) {
		streamPrompt = `Based on the user's prompt and chat history, determine the intensity of the community request. If the request for community is high, provide a brief response referring to the relevant communitys.
	
		User Prompt: ${prompt}
		Chat History: ${chatHistory.length !== 0 ? JSON.stringify(chatHistory) : "No available chat history procide without chat history"}
		system : Your job is to give concise response to user as per the intensity of the community request.
		Your task is to:
		1. Assess the intensity of the community request.
		2. If the intensity is high, generate a concise response referring to the relevant community (e.g., "Here is a community suggestion related to ...", "Here is a community suggestion related to ..." etc.). then create dynamic response based on the intensity.
		3. If the intensity is low, proceed with a normal response.
	
		Response to user:`;
	}
	else {
		streamPrompt = `system prompt:, As a DIY and creative enthusiast, provide an appropriate answer to the user's question. 
		| User Prompt: ${prompt} 
		Context of chat(use This If Present,else just use prompt to reply): ${chatHistory.length !== 0 ? chatHistory : "Context not available"} 
		Response (provide a comprehensive answer using markdown format, utilizing all available symbols such as headings, subheadings, lists, etc.):`;
	}

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

	// Handle non-budget product suggestion
	if (!isBudgetAvailable) {
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
					socket.emit('noProducts', {
						message: "No categories selected."
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
				productDetails = redisProductData.data;
			} else {
				await connectDB();
				console.log("Fetching product from database", categoryIds);

				// Convert categoryIds (strings) to ObjectIds using 'new mongoose.Types.ObjectId()'
				const objectIdCategoryIds = categoryIds.map((id: string) => new mongoose.Types.ObjectId(id));

				// Query for products with any of the specified category IDs
				const DbProductDetails = await Product.find({ catagory: { $in: objectIdCategoryIds } }).lean();

				if (DbProductDetails.length > 0) {
					await setRedisData(`PRODUCT-${parsedCategory}`, JSON.stringify(DbProductDetails), 3600);
				}
				productDetails = DbProductDetails;
			}

			const refinedProductDetails = productDetails.map((product: any) => ({
				_id: product._id,
				productName: product.name,
				description: product.description,
			})).slice(0, 30);

			console.log('Refined product details:', refinedProductDetails);
			const jsonProductDetails = JSON.stringify(refinedProductDetails);
			console.log('JSON product details:', jsonProductDetails);
			// 			const productPrompt = `
			// Suggest the most relevant products based on the user's prompt from the given product catalog. Ensure the products are highly relevant and useful | Max 4-5 suggestions | Product Catalog: {jsonProductDetails} | User Prompt: {prompt}

			// Chat Context  {chatHistory} Return only an array of product IDs:
			// `;
			const productPrompt = `
Based on the user's prompt, suggest the most relevant products from the provided product catalog. Ensure the products are highly relevant and useful, limiting each category to 4-5 suggestions. 

Product Catalog: {jsonProductDetails} | User Prompt: {prompt} | Chat Context: {chatHistory}. 

Provide the response in this format: this is just format use JSON in actual response: 
[object(categoryName: string, products: array of product IDs), object(categoryName: string, products: array of product IDs)]. 

Ensure that:
- Categories only exist if there is at least one product in them.
- Group products efficiently if there are fewer than 4 products in a category.
- Generate groups way that each group must have aleast 1 product else dont include that group in response.
- no comments or additional text in the response, only the array of objects.
- productId should be from Product Catalog Only No Random Value
- never try to generate random productId, always use productId from Product Catalog Only
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
				if (signal.aborted) return;
				if (parsedProduct.length === 0) {
					console.error('No products selected.');
					socket.emit('noProducts', {
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
}


// budget selection
export async function FindNeedOfBudgetSlider(chatHistory: [], socket: Socket) {
	socket.emit("status", {
		message: "Matey Is Creating Budget Slider..."
	})

	const checkContextPrompt = `Based on the user's chat history, determine if a budget slider is needed to provide more accurate product recommendations. 
	Analysis criteria:
	1. check if user has mentioned any budget or price range in the chat history.
	2. check if user have enought context to provide budget slider.

	output format: true/false
	there should be no additional text in the response, only the boolean value of true or false.
	Chat History: {chatHistory}. Is Budget Slider Needed?:`;

	const checkContextTemplate = PromptTemplate.fromTemplate(checkContextPrompt);

	const checkContextLLMChain = checkContextTemplate
		.pipe(llm)
		.pipe(new StringOutputParser());

	const runnableChainOfCheckContext = RunnableSequence.from([
		checkContextLLMChain,
		new RunnablePassthrough(),
	]);

	const needOfBudgetSlider = await runnableChainOfCheckContext.invoke({
		chatHistory: JSON.stringify(chatHistory)
	});

	console.log('Need of budget slider:', needOfBudgetSlider);

	const parsedNeedOfBudgetSlider = Boolean(needOfBudgetSlider);
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
	- all data should be authantic and real based on chat try to find different brands and mention them in tooltip if possible else just mention quality and brand type user will get on certain budget.
	- main goal of tooltip and label is to make user aware of what kind of product user will get on certain budget.

    Chat Context: {chatHistory}

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
			chatHistory: JSON.stringify(chatHistory)
		});

		try {
			const parsedBudgetSlider = JSON.parse(budgetSlider);
			console.log('Parsed budget slider:', parsedBudgetSlider);
			socket.emit('budgetSlider', parsedBudgetSlider);
		} catch (error: any) {
			console.error('Error during budget slider creation:', error.message);

		}
		console.log('Budget slider:', budgetSlider);
	}
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