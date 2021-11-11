import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const folderName: any = path.dirname(__dirname).split(path.sep).pop();

export default {
	appName: 'AGENT-USSD-MENU',
	port: process.env.PORT ?? 5006,
	environment: process.env.NODE_ENV ?? 'development',
	NODE_ENV: process.env.NODE_ENV ?? 'development',
	redisPort: process.env.REDIS_PORT ?? 6379,
	redisExpiry: 60,
	server: 'http://10.81.1.188:5002',
	api: {
		subscriberStatus: '/v1/subscriber/check-kyc-status',
		registration: '/v1/nonbiometric/registration',
		registrationMFS: '/v1/nonbiometric/registrationMfs',
	},
	logs: {
		windows: path.join('C:', 'logs', folderName),
		linux: path.join('home', 'verification', 'logs', folderName),
	},
	database: {
		host: process.env.DB_HOST,
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		name: process.env.DB_DATABASE,
		dialect: process.env.DB_CONNECTION,
	},
};
