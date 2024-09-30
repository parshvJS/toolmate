import express from 'express';
import http from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { handleSocketSerivce } from './services/socket.js';
import { clerkRoute } from './routes/webhooks/clerk.route.js';
import { getUserPaidAndPersonalInfo } from './routes/_private/getUserPaidAndPersonalInfo.route.js';
import { startMessageConsumer } from './services/kafka.js';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
	origin: 'http://localhost:5173', // Your frontend URL
	methods: ['GET', 'POST'],
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.json({ limit: '16kb' }));


// Apply the middleware to /api routes

// web hooks
app.use("/webhook/clerk", express.raw({ type: 'application/json' }));
app.use('/webhook', clerkRoute);

// Routes
app.use('/api/v1', getUserPaidAndPersonalInfo);
app.get('/', (req, res) => {
	res.send('Hello World');
});

// Start Kafka consumer
startMessageConsumer();

// Create an HTTP server
const server = http.createServer(app);

// Create a Socket.IO server
const io = new SocketIOServer(server, {
	cors: {
		origin: true,
		credentials: true,
	},
	allowEIO3: true,
});

// Handle Socket.IO connections
io.on('connection', (socket: Socket) => handleSocketSerivce(socket));

// Start the server
server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
