import { Kafka, Producer, Consumer } from 'kafkajs';
import { Chat } from '../models/chat.model.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const kafka = new Kafka({
	brokers: ['kafka-33f8e5dc-parhsv.l.aivencloud.com:26641'],
	ssl: {
		ca: [fs.readFileSync(path.resolve('./ca.pem'), 'utf-8')],
	},
	sasl: {
		//   username: process.env.KAFKA_USERNAME!,
		//   password: process.env.KAFKA_PASSWORD!,
		username: 'avnadmin',
		password: 'AVNS_OEqobngrLKcfsx4rUka',
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
	const consumer: Consumer = kafka.consumer({ groupId: 'default' });
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

export default kafka;
