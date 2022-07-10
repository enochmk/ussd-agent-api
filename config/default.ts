import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const folderName: any = path.dirname(__dirname).split(path.sep).pop();

export default {
	appName: 'AGENT-USSD-MENU',
	port: process.env.PORT ?? 5006,
	environment: process.env.NODE_ENV || 'development',
	redisPort: process.env.REDIS_PORT ?? 6379,
	redisExpiry: 60000,
	server: 'http://localhost:5002',
	api: {
		subscriberStatus: '/v2/subscriber/check-kyc-status',
		registration: '/v2/nationalId/register',
		registrationMFS: '/v2/nationalId/register/mfs',
	},
	logs: {
		windows: path.join('C:', 'logs', folderName),
		linux: path.join('/', 'var', 'www', 'logs', 'ussd-agent-api-v2'),
	},
	database: {
		host: process.env.DB_HOST,
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		name: process.env.DB_DATABASE,
		dialect: process.env.DB_CONNECTION,
	},
};
