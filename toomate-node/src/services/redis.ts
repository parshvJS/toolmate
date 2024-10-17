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
        // Create a new Redis instance with configuration from environment variables
        const redis = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379"), // Default port to 6379 if not provided
            password: process.env.REDIS_PASSWORD,
            db: 0
        });

        // Event listener for successful connection
        redis.on('connect', () => {
            console.log('Connected to Redis');
        });

        // Event listener for connection errors
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

// utility function of redis

async function getRedisData(key:string){
    try{
        const data = await redisInstance.get(key);
        if(data){
            return {
                success:true,
                data:JSON.parse(data)
            }
        }
        return {
            success:false,
            data:null
        };
    }catch(error:any){
        console.error('Error getting data from Redis:', error);
        return {
            success:false,
            data:null
        }
    }
}

async function setRedisData(key: string, value: string, expiry: number) {
    try {
        const data = await redisInstance.set(key, value, 'EX', expiry);
        console.log("Data set to Redis");
        return data;
    } catch (error: any) {
        console.error('Error setting data to Redis:', error);
        throw new Error(error.message);
    }
}





export {
    startRedisConnection,
    getRedisData,
    setRedisData
};
