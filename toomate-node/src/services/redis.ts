import connectDB from '../db/db.db.js';
import UserChat from '../models/userChat.model.js';
// import { UserPayment } from '../models/userPayment.model.js';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { summarizeAndStoreChatHistory } from './langchain/langchain.js';
import { Chat } from '../models/chat.model.js';

// Load environment variables from .env file
dotenv.config();

// Global Redis instances
let redisInstance: Redis;
let expirationSubscriber: Redis | null = null;

/**
 * Initializes and starts a connection to Redis.
 * @returns {Promise<Redis>} A promise that resolves to the Redis instance.
 */
async function startRedisConnection(): Promise<Redis> {
    try {
        console.log("REDIS_URL", process.env.REDIS_URL, "REDIS_PORT", process.env.REDIS_PORT, "REDIS_PASSWORD", process.env.REDIS_PASSWORD, "REDIS_USERNAME", process.env.REDIS_USERNAME);
        
        const redis = new Redis({
            username: process.env.REDIS_USERNAME,
            host: process.env.REDIS_URL,
            port: parseInt(process.env.REDIS_PORT!),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 5, // Reduced retries
            reconnectOnError: (err) => {
                console.error('Reconnect on error:', err.message);
                return true; // Attempt reconnection on specific errors
            },
        });
        console.log('Created Redis connection');

        redis.on('connect', () => {
            console.log('Connected to Redis');
        });

        redis.on('error', (err) => {
            console.error('Error connecting to Redis:', err);
        });

        return redis;
    } catch (error: any) {
        console.error('Error connecting to Redis:', error);
        throw new Error(error.message);
    }
}

/**
 * Subscribes to Redis key expiration events to log expired keys.
 * @param {Redis} redis - The Redis instance.
 */
function subscribeToKeyExpiration(redis: Redis) {
    if (!expirationSubscriber) {
        expirationSubscriber = redis.duplicate(); // Create a duplicate connection for subscriptions
        expirationSubscriber.on('connect', () => {
            console.log('Expiration subscriber connected');
        });

        expirationSubscriber.on('error', (err) => {
            console.error('Expiration subscriber error:', err);
        });

        expirationSubscriber.subscribe('__keyevent@0__:expired', (err) => {
            if (err) {
                console.error('Failed to subscribe to key expiration events:', err);
            } else {
                console.log('Subscribed to key expiration events');
            }
        });

        expirationSubscriber.on('message', async (_, expiredKey) => {
            console.log(`Key expired: ${expiredKey}`);
            await connectDB();
            try {
                const sessionId = expiredKey.split("USER-CHAT-")[1];
                const userChat = await UserChat.findOne({ sessionId: sessionId }).lean();
                if (userChat && userChat.isMateyMemoryOn) {
                    const paymentData = await getRedisData(`USER-PAYMENT-${userChat.userId}`);
                    const plan = paymentData.success ? JSON.parse(paymentData.data).planAccess[2] : false;
                    if (plan) {
                        const tempChat = await Chat?.find({ sessionId: sessionId }).lean();
                        const newChat = tempChat.map((chat: any) => ({
                            role: chat.role,
                            message: chat.message,
                        }));
                        if (newChat.length > 0) {
                            await summarizeAndStoreChatHistory(String(userChat.userId), tempChat);
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error setting data to Redis:', error);
            }
        });
    }
}

// Initialize the Redis connection
(async () => {
    redisInstance = await startRedisConnection();
    subscribeToKeyExpiration(redisInstance);
})();

// Start listening for expiration events

// Redis utility functions
async function getRedisData(key: string) {
    try {
        const data = await redisInstance.get(key);
        if (data) {
            return {
                success: true,
                data: JSON.parse(data)
            };
        }
        return {
            success: false,
            data: null
        };
    } catch (error: any) {
        console.error('Error getting data from Redis:', error);
        return {
            success: false,
            data: null
        };
    }
}

async function setRedisData(key: string, value: any, expiry: number) {
    try {
        const data = await redisInstance.set(key, JSON.stringify(value), 'EX', expiry);
        return data;
    } catch (error: any) {
        console.error('Error setting data to Redis:', error);
        throw new Error(error.message);
    }
}

async function appendArrayItemInRedis(key: string, value: any) {
    try {
        const updatedData = [value];
        await redisInstance.set(key, JSON.stringify(updatedData), 'EX', 3600);
        return {
            success: true,
            data: updatedData
        };
    } catch (error: any) {
        console.error('Error overriding data in Redis:', error);
        return {
            success: false,
            data: null
        };
    }
}
async function deleteRedisData(key: string) {
    try {
        const data = await redisInstance.del(key);
        return true;
    } catch (error: any) {
        console.error('Error deleting data from Redis:', error);
        return false
    }
}

// Gracefully close Redis connections on shutdown
process.on('SIGINT', async () => {
    if (redisInstance) await redisInstance.quit();
    if (expirationSubscriber) await expirationSubscriber.quit();
    console.log('Redis connections closed');
    process.exit(0);
});

export {
    startRedisConnection,
    getRedisData,
    setRedisData,
    appendArrayItemInRedis,
    deleteRedisData,
    subscribeToKeyExpiration
};
