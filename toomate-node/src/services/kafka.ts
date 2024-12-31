import { Kafka, Producer, Consumer } from 'kafkajs';
import { Chat } from '../models/chat.model.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../db/db.db.js';
import mongoose from 'mongoose';
dotenv.config();


const kafka = new Kafka({
	brokers: ['kafka-389163db-parshvaiven08-6f27.c.aivencloud.com:27221'],
	ssl: {
		ca: [fs.readFileSync(path.resolve('./ca.pem'), 'utf-8')],
	},
	sasl: {
		//   username: process.env.KAFKA_USERNAME!,
		//   password: process.env.KAFKA_PASSWORD!,
		username: 'avnadmin',
		password: 'AVNS_rlTbso3AMLlbbvcD6O4',
		mechanism: 'plain',	
	},
});

let producer: null | Producer = null;

export async function createProducer() {
	if (producer) return producer;

	const _producer = kafka.producer();
	await _producer.connect();
	producer = _producer;
	return producer;
}


// this message producer is for premium or logged in user only
export async function produceNewMessage(
	message: string,
	sessionId: string,
	isProductSuggested: boolean,
	isMateyProduct: boolean,
	isBunningsProduct: boolean,
	productSuggestionList: any[],
	mateyProduct: any[],
	bunningsProductList: string[],
	isCommunitySuggested: boolean,
	communityId: string[],
	role: string
) {
	const producer = await createProducer();
	const createdAt = Date.now();
	await producer.send({
		topic: 'NEW-MESSAGE',
		messages: [
			{
				key: `message-${Date.now()}`,
				value: JSON.stringify({
					message,
					sessionId,
					isProductSuggested,
					isMateyProduct,
					isBunningsProduct,
					productSuggestionList,
					mateyProduct,
					bunningsProductList,
					isCommunitySuggested,
					communityId,
					role,
					createdAt
				}),
			}
		]
	});
	
	return true;
}


export async function startNewMessageConsumer() {

	console.log('Consumer is running..');
	const consumer = kafka.consumer({ groupId: 'default' });
	await consumer.connect();
	await consumer.subscribe({ topic: 'NEW-MESSAGE', fromBeginning: true });

	await consumer.run({
		autoCommit: true,
		eachMessage: async ({ message, pause }) => {
			try {
				await connectDB();
				const stringifiedMessage = message.value?.toString();
				// Parse the message
				const {
					message: msg,
					sessionId,
					isProductSuggested,
					isMateyProduct,
					isBunningsProduct,
					productSuggestionList,
					mateyProduct,
					bunningsProductList,
					isCommunitySuggested,
					communityId,
					role,
					createdAt
				} = JSON.parse(stringifiedMessage || "{}");
				if (!msg) {
					return;
				}



				const data = {
					message: msg,
					sessionId,
					isProductSuggested,
					isMateyProduct,
					isBunningsProduct,
					productSuggestionList:productSuggestionList,
					mateyProduct,
					bunningsProductList: bunningsProductList,
					isCommunitySuggested,
					communityId,
					role,
					createdAt
				}

				// Insert message into the database with all the fields
				await Chat.create(data);
			} catch (err) {
				console.error('Error processing message:', err);
				pause(); // Pause processing
				setTimeout(() => {
					consumer.resume([{ topic: 'NEW-MESSAGE' }]); // Resume after a delay
				}, 60 * 1000);
			}
		},
	});
}


//this producer is for free preview user
export async function produceMessage(
	message: string,
	sessionId: string,
	expression: string,
	role: string
) {
	const producer = await createProducer();
	await producer.send({
		messages: [
			{
				key: `message-${Date.now()}`,
				value: JSON.stringify({ message, sessionId, expression, role }), // Include sessionId in the value
			},
		],
		topic: 'PREV-MESSAGES',
	});
	return true;
}
export async function startMessageConsumer() {
	const consumer: Consumer = kafka.consumer({ groupId: 'new-message-group' });
	await consumer.connect();
	await consumer.subscribe({ topic: 'PREV-MESSAGES', fromBeginning: true });

	await consumer.run({
		autoCommit: true,
		eachMessage: async ({ message, pause }) => {
			try {
				// Parse the message
				const {
					message: msg,
					sessionId,
					expression,
					role,
				} = JSON.parse(message.value?.toString() || '{}');

				if (!msg) {
					return;
				}

		
				// Insert message into the database
				await Chat.create({
					message: msg,
					sessionId,
					expression,
					role,
				});
			} catch (err) {
				console.error('Error processing message:', err);
				pause(); // Pause processing
				setTimeout(() => {
					consumer.resume([{ topic: 'PREV-MESSAGES' }]); // Resume after a delay
				}, 60 * 1000);
			}
		},
	});
}




export default kafka;