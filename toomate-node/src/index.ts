import { OpenAI } from '@langchain/openai';
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { GetAnswerFromPrompt } from './services/langchain.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { produceMessage, startMessageConsumer } from './services/kafka.js';
import { handleSocketSerivce } from './services/socket.js';

const app = express();
const PORT = 5000;

app.use(
	cors({
		origin: 'http://localhost:5173', // Your frontend URL
		methods: ['GET', 'POST'],
	})
);
app.use(cookieParser());

app.use(
	express.urlencoded({
		extended: true,
		limit: '16kb',
	})
);

app.use(
	express.json({
		limit: '16kb',
	})
);

// Create an HTTP server
const server = http.createServer(app);
startMessageConsumer();
// Create a Socket.IO server
const io = new SocketIOServer(server, {
	cors: {
		origin: true,
		credentials: true,
	},
	allowEIO3: true,
});
app.get('/', (req, res) => {
	res.send('Hello World');
});
// Serve basic express routes (optional)
app.get('/socket', (req, res) => {
	res.send('Socket.IO Server for Streaming Responses');
});

// Handle Socket.IO connections
io.on('connection',(socket:Socket)=>handleSocketSerivce(socket));

server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
