import dotenv from 'dotenv';

dotenv.config();

export default {
	port: process.env.PORT ?? 5006,
	environment: process.env.NODE_ENV ?? 'development',
	redisPort: process.env.REDIS_PORT ?? 6379,
	redisExpiry: 60,
};
