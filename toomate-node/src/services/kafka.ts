import { Kafka, Producer, Consumer } from 'kafkajs';
import { Chat } from '../models/chat.model.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../db/db.db.js';
dotenv.config();


const kafka = new Kafka({
	brokers: ['kafka-505f1c5-nikunjsheth402-4876.f.aivencloud.com:15665'],
	ssl: {
		ca: [fs.readFileSync(path.resolve('./ca.pem'), 'utf-8')],
	},
	sasl: {
		//   username: process.env.KAFKA_USERNAME!,
		//   password: process.env.KAFKA_PASSWORD!,
		username: 'avnadmin',
		password: 'AVNS_GFmLpMFtFHn6etwKGkb',
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
	isCommunitySuggested: boolean,
	role: string,
	communityId: string[] = [],
	productId: string[] = []
) {
	const producer = await createProducer();
	const createdAt = Date.now();
	await producer.send({
		topic: 'NEW-MESSAGE',
		messages: [
			{
				key: `message-${Date.now()}`,
				value: JSON.stringify({ message, sessionId, isProductSuggested, isCommunitySuggested, communityId, productId, role, createdAt }), 
			}
		]
	})
	console.log("New message created----------------------");
	return true;
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
	console.log('creating new message----------------------');
	return true;
}
export async function startMessageConsumer() {
	console.log('Consumer is running..');
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
					console.log('No message found');
					return;
				}

				console.log(
					`New Message Recv: ${msg}, Session ID: ${sessionId}`
				);

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


export async function startNewMessageConsumer() {

	console.log('Consumer is running..');
	const consumer: Consumer = kafka.consumer({ groupId: 'default' });
	await consumer.connect();
	await consumer.subscribe({ topic: 'NEW-MESSAGE', fromBeginning: true });

	await consumer.run({
		autoCommit: true,
		eachMessage: async ({ message, pause }) => {
			try {
				await connectDB();
				// Parse the message
				const {
					message: msg,
					sessionId,
					isProductSuggested,
					isCommunitySuggested,
					communityId,
					productId,
					role,
					createdAt
				} = JSON.parse(message.value?.toString() || '{}');

				if (!msg) {
					console.log('No message found');
					return;
				}

				console.log(
					`New Message Recv: ${msg}, Session ID: ${sessionId}`
				);

				// Insert message into the database
				await Chat.create({
					message: msg,
					sessionId,
					isProductSuggested,
					isCommunitySuggested,
					communityId,
					productId,
					role,
					createdAt
				});
				console.log("data got inserted");
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

export default kafka;