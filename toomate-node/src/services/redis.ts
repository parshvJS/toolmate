import connectDB from '../db/db.db.js';
import UserChat from '../models/userChat.model.js';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { Chat } from '../models/chat.model.js';
import UserMemory from '../models/userMemory.model.js';
import { getMatchingPrefix } from '../utils/utilsFunction.js';

dotenv.config();

let redisInstance: Redis;
let expirationSubscriber: Redis | null = null;

async function startRedisConnection(): Promise<Redis> {
    try {
        const redis = new Redis({
            username: process.env.REDIS_USERNAME,
            host: process.env.REDIS_URL,
            port: parseInt(process.env.REDIS_PORT!),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 5,
            reconnectOnError: (err) => {
                console.error('Reconnect on error:', err.message);
                return true;
            },
        });

        redis.on('connect', () => {
            console.log('Connected to Redis');
        });

        return redis;
    } catch (error: any) {
        console.error('Error connecting to Redis:', error);
        throw new Error(error.message);
    }
}

// Store both the value and its metadata in Redis
async function setRedisData(key: string, value: any, expiry: number = 3600) {
    try {
        // Create a metadata key that won't expire
        const metaKey = `meta:${key}`;
        const metadata = {
            value: value,
            expiresAt: Date.now() + (expiry * 1000)
        };

        // Store the metadata without expiration
        await redisInstance.set(metaKey, JSON.stringify(metadata));

        // Store the actual value with expiration as before
        const data = await redisInstance.set(key, JSON.stringify(value), 'EX', expiry);

        return data;
    } catch (error: any) {
        console.error('Error setting data to Redis:', error);
        throw new Error(error.message);
    }
}

function subscribeToKeyExpiration(redis: Redis) {
    expirationSubscriber = redis.duplicate();
    expirationSubscriber.subscribe('__keyevent@0__:expired', (err, count) => {
        if (err) {
            console.error("Error subscribing to key expiration:", err);
        } else {
            console.log(`Subscribed to ${count} channels.`);
        }
    });

    expirationSubscriber.on('message', async (channel, key) => {
        if (channel === '__keyevent@0__:expired') {
            try {
                const metaKey = `meta:${key}`;
                console.log(`Key ${key} has expired`, key.split('-'));
                const matchedPrefix = getMatchingPrefix(key);
                if (!matchedPrefix.isMatched || matchedPrefix.prefix == null) {
                    console.log(`Key ${key} is not valid to store in database`);
                    return;
                }
                // Get the metadata
                const metadataStr = await redisInstance.get(metaKey);
                if (metadataStr) {
                    const metadata = JSON.parse(metadataStr);

                    // Store in database
                    await storeExpiredKeyInDatabase(key, metadata.value, matchedPrefix.prefix);

                    // Clean up metadata after successful storage
                    await redisInstance.del(metaKey);
                }
            } catch (error) {
                console.error(`Error processing expired key ${key}:`, error);
                // You might want to implement retry logic here
            }
        }
    });
}

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

// Function to check for any orphaned metadata during startup
async function cleanupOrphanedMetadata() {
    try {
        // Scan for all metadata keys
        const stream = redisInstance.scanStream({
            match: 'meta:*',
            count: 100
        });

        stream.on('data', async (keys: string[]) => {
            for (const metaKey of keys) {
                const originalKey = metaKey.replace('meta:', '');
                const matchedPrefix = getMatchingPrefix(originalKey);
                if (!matchedPrefix.isMatched || matchedPrefix.prefix == null) {
                    console.log(`Key ${originalKey} is not valid to store in database`);
                    return;
                }
                // Check if the original key exists
                const exists = await redisInstance.exists(originalKey);
                if (!exists) {
                    // Get the metadata
                    const metadataStr = await redisInstance.get(metaKey);
                    if (metadataStr) {
                        const metadata = JSON.parse(metadataStr);

                        // If it's past expiration time, process it
                        if (metadata.expiresAt < Date.now()) {
                            await storeExpiredKeyInDatabase(originalKey, metadata.value, matchedPrefix.prefix);
                        }
                    }
                    // Clean up the metadata
                    await redisInstance.del(metaKey);
                }
            }
        });
    } catch (error) {
        console.error('Error cleaning up orphaned metadata:', error);
    }
}

// Example function to store expired key data in database
async function storeExpiredKeyInDatabase(key: string, value: any, dbFlag: string) {
    console.log(`Stored expired key ${key} with value:`, value);
    try {
        switch (dbFlag) {
            case `USER-CHAT`:
                const sessionId = key.split('-')[2];
                console.log("SessionId", sessionId)
                const userChat = await UserChat.findOne({ sessionId });
                if (userChat) {
                    const userMem = await UserMemory.findOne({ userId: userChat.userId });
                    if (userMem) {
                        userMem.memory = JSON.parse(value);
                        await userMem.save();
                    }
                    else {
                        const newUserMem = new UserMemory({
                            userId: userChat.userId,
                            memory: JSON.parse(value)
                        });
                        await newUserMem.save();
                    }
                } else {

                }
                break;
            default:
                console.log("Invalid key to store in database");
        }
    } catch (error) {
        console.error('Error storing in database:', error);
        throw error;
    }
}

// Initialize Redis connection and start cleanup
(async () => {
    redisInstance = await startRedisConnection();
    subscribeToKeyExpiration(redisInstance);

    // Run cleanup on startup
    await cleanupOrphanedMetadata();
})();

// Graceful shutdown
process.on('SIGINT', async () => {
    if (redisInstance) await redisInstance.quit();
    if (expirationSubscriber) await expirationSubscriber.quit();
    console.log('Redis connections closed');
    process.exit(0);
});


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

async function storeDataTypeSafe(key: string, value: any,ttl:number=3600) {
    try {
        await redisInstance.set(key,value,'EX',ttl);
        return true;
    } catch (error: any) {
        console.error('Error storing data in Redis:', error);
        return false;
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
    storeDataTypeSafe
};
