import connectDB from '@/db/db.db';
import UserChat from '@/models/userChat.model';
import { UserPayment } from '@/models/userPayment.model';
import dotenv from 'dotenv';
import Redis from 'ioredis';

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
            const userChat = await UserChat.findOne({ sessiondId: sessionId }).lean();
            if (userChat && userChat.isMateyMemoryOn) {
                const userId = userChat.userId;
                const userPayment = await UserPayment.findOne({ userId: userId });
                let plan = false;
                if (userPayment) {
                    plan = userPayment.planAccess[2] == true;
                }

                if (plan) {
                    await summurizeAndStoreChatHistory(userId,userChat);
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

async function setRedisData(key: string, value: string, expiry: number) {
    try {
        const data = await redisInstance.set(key, JSON.stringify(value), 'EX', expiry);
        console.log("Data set to Redis with expiry.");
        return data;
    } catch (error: any) {
        console.error('Error setting data to Redis:', error);
        throw new Error(error.message);
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
    deleteRedisData
};
