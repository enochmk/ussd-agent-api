import os from 'os';
import fs from 'fs';
import path from 'path';
import config from 'config';
import moment from 'moment';
import winston, { format } from 'winston';

const { timestamp, printf } = format;
const NODE_ENV = config.get('environment');
const LOG_WINDOWS = config.get('logs.windows');
const LOG_LINUX = config.get('logs.linux');

let directory: any = os.platform() === 'linux' ? LOG_LINUX : LOG_WINDOWS;
directory = NODE_ENV === 'development' ? 'logs' : directory;
directory = path.join(directory, moment().format('YYYYMMDD'));
if (!fs.existsSync(directory)) {
	// forcefully create the folder if it does not exist.
	fs.mkdirSync(directory, { recursive: true });
}

// custom log formatter
const customLogFormat = {
	simple: format.combine(
		printf(({ level, message, timestamp, ...rest }) => {
			const more = Object.keys(rest).length ? JSON.stringify(rest) : '';
			return `${timestamp} [${level}] ${message} ${more}`.trim();
		})
	),
	short: printf((data: any) => {
		const format = {
			timestamp: data.timestamp,
			level: data.level,
			message: data.message,
			requestID: data.requestID,
			agentID: data.agentID,
		};

		return JSON.stringify(format);
	}),
	json: printf((data: any) => {
		let format: any = {
			timestamp: data.timestamp,
			level: data.level,
			message: data.message,
			requestID: data.requestID,
			agentID: data.agentID,
		};

		// remove duplicates
		delete data.timestamp;
		delete data.level;
		delete data.message;
		delete data.requestID;
		delete data.agentID;

		format.more = { ...data };
		return JSON.stringify(format);
	}),
};

// Transport Options
const options = {
	console: {
		level: 'verbose',
		colorize: true,
		format: format.combine(
			customLogFormat.simple,
			format.colorize({ all: true })
		),
	},
	error: {
		level: 'error',
		format: customLogFormat.json,
		filename: path.join(directory, 'error.log'),
	},
	combined: {
		level: 'verbose',
		format: customLogFormat.json,
		filename: path.join(directory, 'combined.log'),
	},
	debug: {
		level: 'debug',
		format: customLogFormat.json,
		filename: path.join(directory, 'debug.log'),
	},
};

// supported transport
const transports: any = [
	new winston.transports.File(options.error),
	new winston.transports.File(options.combined),
];

if (NODE_ENV === 'development') {
	transports.push(new winston.transports.Console(options.console));
	transports.push(new winston.transports.File(options.debug));
}

// create winston logger with configurations
const logger = winston.createLogger({
	transports: transports,
	levels: winston.config.npm.levels,
	// defaultMeta: { service: config.get('appName') },
	format: format.combine(
		timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		format.errors({ stack: true })
	),
});

export default logger;
