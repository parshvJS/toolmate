import connectDB from '../db/db.db.js';
import UserChat from '../models/userChat.model.js';
import { UserPayment } from '../models/userPayment.model.js';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { summarizeAndStoreChatHistory } from './langchain/langchain.js';
import { Chat } from '../models/chat.model.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Initializes and starts a connection to Redis.
 * @returns {Promise<Redis>} A promise that resolves to the Redis instance.
 */
async function startRedisConnection(): Promise<Redis> {
    try {
        console.log("REDIS_URL", process.env.REDIS_URL,"REDIS_PORT", process.env.REDIS_PORT,"REDIS_PASSWORD", process.env.REDIS_PASSWORD,"REDIS_USERNAME", process.env.REDIS_USERNAME);
        const redis = new Redis({
            username:process.env.REDIS_USERNAME,
            host: process.env.REDIS_URL,
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
        });

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

// Initialize the Redis connection
const redisInstance = await startRedisConnection();

/**
 * Subscribes to Redis key expiration events to log expired keys.
 * @param {Redis} redis - The Redis instance.
 */
function subscribeToKeyExpiration(redis: Redis) {
    // Create a separate Redis instance to subscribe to expiration events
    const expirationSubscriber = new Redis({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
    });
    console.log('Created expiration subscriber');

    // Subscribe to expiration events on database 0
    expirationSubscriber.subscribe('__keyevent@0__:expired', (err) => {
        if (err) {
            console.error('Failed to subscribe to key expiration events:', err);
        }
    });

    // Log expired keys
    expirationSubscriber.on('message', async (channel, expiredKey) => {
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

// Start listening for expiration events
subscribeToKeyExpiration(redisInstance);

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

export {
    startRedisConnection,
    getRedisData,
    setRedisData,
    appendArrayItemInRedis,
    deleteRedisData
};
