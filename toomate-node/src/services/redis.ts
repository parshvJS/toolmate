import connectDB from '../db/db.db.js';
import UserChat from '../models/userChat.model.js';
import { UserPayment } from '../models/userPayment.model.js';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { summarizeAndStoreChatHistory } from './langchain/langchain.js';

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
    // expirationSubscriber.subscribe('__keyevent@0__:expired', (err) => {
    //     if (err) {
    //         console.error('Failed to subscribe to key expiration events:', err);
    //     }
    // });

    // // Log expired keys
    // expirationSubscriber.on('message', async (channel, expiredKey) => {
    //     console.log(`Key expired: ${expiredKey}`);
    //     await connectDB();
    //     try {
    //         const sessionId = expiredKey.split("USER-CHAT-")[1];
    //         const userChat = await UserChat.findOne({ sessionId: sessionId }).lean();
    //         console.log("User chat found:", userChat);
    //         if (userChat && userChat.isMateyMemoryOn) {
    //             const userId = userChat.userId;
    //             const userPayment = await UserPayment.findOne({ userId: userId });
    //             let plan = false;
    //             if (userPayment) {
    //                 console.log("User payment found,Giving User Memory Access");
    //                 plan = userPayment.planAccess[2] == true;
    //             }

    //             if (plan) {
    //                 console.log("User has plan access, storing chat history in user memory");
    //                 const tempChat=  [
    //                     {
    //                       role: "user",
    //                       message: "Hi there! I’m looking to revamp my old wooden dining table. It’s got some scratches and a few water stains. What’s the best way to prep it for painting?"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "Great project! To prep the table, start by sanding it down to remove the scratches and stains. Do you have sandpaper or a power sander?"
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "I have some sandpaper, but I’m not sure which grit to use. Should I start with a coarse grit or a fine one?"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "For your table, start with a coarse grit, like 80 or 120, to remove the worst scratches. Then, switch to a finer grit, like 220, to smooth it out. This will help the paint adhere better."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "That makes sense! Once I sand it down, do I need to apply a primer before painting?"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "Yes, applying a primer is a good idea, especially if the table has stains. It will create a uniform surface and improve paint adhesion. Make sure to let the primer dry completely before painting."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "What type of primer should I use? I’m planning to use a latex paint afterward."
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "For latex paint, use a latex primer. It will help seal the wood and enhance the paint color. Look for a primer that’s labeled as stain-blocking for the best results."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "Got it! I want a matte finish for the paint. Does that change anything in the prep process?"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "Not really! The prep is mostly the same. Just ensure that you sand down the surface well and clean off any dust before applying the paint. A matte finish often requires a bit more care to avoid brush strokes."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "Thanks for that! Do you have any tips for applying the paint to avoid streaks?"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "Absolutely! Use a high-quality brush or foam roller for a smooth finish. Apply thin layers of paint and allow each layer to dry before adding another. Sand lightly between coats for an even better finish."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "I’ll definitely follow that. How long do I need to wait between coats?"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "It usually depends on the paint, but 2-4 hours is a good rule of thumb for latex paint. Always check the label for specific drying times."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "What about cleanup? I want to make sure I don’t ruin my brushes."
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "For latex paint, clean your brushes with warm, soapy water right after use. If the paint dries on them, it can be difficult to clean off. Make sure to reshape the bristles before storing them."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "Great advice! I’m really excited about this project. Do you have any suggestions on colors?"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "It really depends on your style! Neutral colors like gray or beige can give a modern look, while bold colors like navy or forest green can make a statement. Consider what other decor you have to match."
    //                     },
    //                     {
    //                       role: "user",
    //                       message: "I’m leaning towards a dark green. It should look nice with my other furniture. Thanks for all the help!"
    //                     },
    //                     {
    //                       role: "ai",
    //                       message: "That sounds beautiful! Enjoy your project, and feel free to ask if you have more questions along the way!"
    //                     }
    //                   ];
    //                 await summarizeAndStoreChatHistory(String(userId),tempChat);
    //                 console.log("Chat history stored in user memory");
    //             }
    //         }


    //     } catch (error: any) {
    //         console.error('Error setting data to Redis:', error);
    //     }
    // });
}

// Start listening for expiration events
// subscribeToKeyExpiration(redisInstance);

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


async function appendArrayItemInRedis(key: string, value: any) {
    try {
        const data = await getRedisData(key);
        if (data.success) {
            const parsedData = JSON.parse(data.data);
            const updatedData = [...parsedData, value];
            await redisInstance.set(key, JSON.stringify(updatedData));
            return {
                success: true,
                data: updatedData
            }
        }
        console.log("Data appended to Redis.");
        return {
            success: false,
            data: null
        };
    } catch (error: any) {
        console.error('Error appending data to Redis:', error);
        return {
            success: false,
            data: null
        }
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
