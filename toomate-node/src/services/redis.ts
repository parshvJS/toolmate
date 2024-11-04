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
        const redis = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            db: 0
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
    // Enable keyspace notifications for expired keys
    redis.config('SET', 'notify-keyspace-events', 'Ex', (err, res) => {
        if (err) {
            console.error('Failed to set notify-keyspace-events:', err);
            return;
        }
        console.log('Keyspace notifications enabled for expired keys.');
    });

    // Create a separate Redis instance to subscribe to expiration events
    const expirationSubscriber = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        db: 0
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
            console.log("User chat found:", userChat);
            if (userChat && userChat.isMateyMemoryOn) {
                const paymentData = await getRedisData(`USER-PAYMENT-${userChat.userId}`);
                const plan = paymentData.success ? JSON.parse(paymentData.data).planAccess[2] : false;
                if (plan) {
                    console.log("User has plan access, storing chat history in user memory");
                    const tempChat =await Chat?.find({ sessionId: sessionId }).lean();
                    const newChat = tempChat.map((chat:any) => {
                        return {
                            role: chat.role,
                            message: chat.message
                        }
                    })
                    if(newChat.length > 0)
                    {
                        await summarizeAndStoreChatHistory(String(userChat.userId), tempChat);
                        console.log("Chat history stored in user memory");

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
        console.log("Data set to Redis with expiry.");
        return data;
    } catch (error: any) {
        console.error('Error setting data to Redis:', error);
        throw new Error(error.message);
    }
}

async function appendArrayItemInRedis(key: string, value: any) {
    try {
        console.log("Overriding data in Redis.");
        const updatedData = [value];
        await redisInstance.set(key, JSON.stringify(updatedData), 'EX', 3600);
        console.log("Data overridden in Redis.");
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
        console.log("Data deleted from Redis.");
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
