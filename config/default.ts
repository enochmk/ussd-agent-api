import dotenv from 'dotenv';

dotenv.config();

export default {
	port: process.env.PORT ?? 5006,
	environment: process.env.NODE_ENV ?? 'development',
	redisPort: process.env.REDIS_PORT ?? 6379,
	redisExpiry: 60,
	api: {
		subscriberStatus: '/v1/subscriber/check-kyc-status',
		registration: '/v1/nonbiometric/registration',
		registrationMFS: '/v1/nonbiometric/registrationMfs',
	},
	server: 'http://10.81.1.188:5002',
	// server: 'localhost:5002',
};
