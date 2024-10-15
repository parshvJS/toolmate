import express from 'express';
import http from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createClient } from 'redis';

import { handleSocketSerivce } from './services/socket.js';
import { clerkRoute } from './routes/webhooks/clerk.route.js';
import { paidDashbaord } from './routes/_private/paidDashboard.js';
import { startMessageConsumer, startNewMessageConsumer } from './services/kafka.js';
import { admin } from './routes/admin/admin.js';
import { community } from './routes/_private/community.js';
import Redis from 'ioredis';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
	origin: ['http://localhost:5173', /\.ngrok\.io$/], // Your frontend URL and ngrok domains
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
app.use('/api/v1', paidDashbaord);
app.use('/api/v1', admin)
app.use('/api/v1', community);
app.get('/', (req, res) => {
	res.send('Hello World');
});


// Your AWS ElastiCache Redis endpoint
const redis = new Redis({
	host: 'my-redis-cluster-temp.kn5h3r.ng.0001.apse2.cache.amazonaws.com',
	port: 6379, // default port for Redis
	tls:{}

});
  
  // Test connection by setting and getting a key
  async function testRedis() {
	try {
	  // Set a key-value pair
	  await redis.set('testKey', 'Hello from Node.js server!');
  
	  // Get the value of the key
	  const result = await redis.get('testKey');
	  console.log('Value from Redis:', result); // Expected output: "Hello from Node.js server!"
	} catch (err) {
	  console.error('Error connecting to Redis:', err);
	} finally {
	  // Close the connection
	  redis.disconnect();
	}
  }
  
  testRedis();

// Start Kafka consumer
startNewMessageConsumer();
startMessageConsumer();
console.log('starting new message consumer');
// startNewMessageConsumer();
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
