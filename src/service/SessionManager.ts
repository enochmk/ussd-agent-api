import redis, { RedisClient } from 'redis';
import config from 'config';
import util from 'util';

import logger from '../utils/logger';
import Messages from '../constant/Messages.json';
import MenuJson from '../constant/Menu.json';
import SessionInterface from '../interface/Session';
import MenuInterface from '../interface/Menu';
import MenuRequest from '../interface/MenuRequest';
import sendResponse from '../helper/SendResponse';
import { createSession } from '../includes/session';
import optionHandler from '../includes/handler';

const REDIS_EXPIRY = <number>config.get('redisExpiry');
const REDIS_PORT = <number>config.get('redisPort');
const MAIN_BUTTON = ['00'];
const BACK_BUTTON = ['#'];

// connect to redis only Once!
const client: RedisClient = redis.createClient(REDIS_PORT);
client.get = <any>util.promisify(client.get);
client.del = <any>util.promisify(client.del);

/**
 * @description: Handle the session for a given sessionID
 * @param menuRequest: MenuRequest
 * @return:Promise<string>
 */
const sessionManager = async (menuRequest: MenuRequest): Promise<string> => {
	const Menu: MenuInterface = MenuJson;

	// params
	const sessionID = menuRequest.sessionID;
	const starcode = menuRequest.starcode;
	const userdata = menuRequest.userdata;
	const timestamp = menuRequest.timestamp;
	let msisdn = menuRequest.msisdn.toString();
	msisdn = msisdn.substr(msisdn.length - 9);

	let sessions: any = [];
	let page = '0';
	let flag: any = 1;
	let message = Messages.invalidInput;
	let response = null;

	// get session from cache
	const data = <any>await client.get(sessionID);

	// ? Handle main button
	if (MAIN_BUTTON.includes(userdata)) {
		logger.info({
			message: 'Main',
			label: `Session Manager`,
			requestID: sessionID,
			agentID: msisdn,
			sessions,
		});

		data && client.del(sessionID);
	}

	// ? No session, create session.
	if (!data) {
		const question = Menu[page];

		const session: SessionInterface = createSession(
			sessionID,
			msisdn,
			question,
			null,
			null,
			null
		);

		sessions.push(session);
		client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));
		logger.info({
			message: 'New Session',
			label: `Session Manager`,
			requestID: sessionID,
			agentID: msisdn,
		});

		return sendResponse({
			sessionID,
			msisdn,
			starcode,
			menu: Menu[page],
			flag: 1,
			timestamp,
		});
	}

	// convert from string to JSON array of data
	sessions = JSON.parse(data);
	let lastSession = <any>sessions[sessions.length - 1];

	// ? Handle empty userdata
	if (!userdata) {
		logger.info({
			message: 'Empty Userdata',
			label: `Session Manager`,
			requestID: sessionID,
			agentID: msisdn,
			sessions,
		});
		return sendResponse({
			sessionID,
			msisdn,
			starcode,
			menu: lastSession.question,
			flag: 1,
			timestamp,
		});
	}

	// ? Handle back button
	if (BACK_BUTTON.includes(userdata)) {
		if (sessions.length > 1) {
			sessions.pop();
			const lastSession = sessions[sessions.length - 1];

			if (sessions.length === 1) {
				lastSession.page = null;
				lastSession.option = null;
				lastSession.userdata = null;
				sessions[0] = lastSession;
			}

			client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));
			logger.info({
				message: 'Back',
				label: `Session Manager`,
				requestID: sessionID,
				agentID: msisdn,
				sessions,
			});
			return sendResponse({
				sessionID,
				msisdn,
				starcode,
				menu: lastSession.question,
				flag: 1,
				timestamp,
			});
		}
	}

	// ? userdata is defined: Update previous data && define the option
	lastSession.userdata = userdata;
	if (!lastSession.option) {
		lastSession.option = userdata;
	}

	// remove the old item and replace with new item
	sessions = sessions.filter((value: any, index: any) => {
		return value.id !== lastSession.id;
	});
	sessions.push(lastSession);
	client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));

	// option set, pass to optionHandler
	if (lastSession.option) {
		response = await optionHandler(
			lastSession.option,
			sessionID,
			msisdn,
			client
		);

		flag = response.flag;
		message = response.message;

		logger.info({
			message: message,
			label: `Option ${lastSession.option}`,
			requestID: sessionID,
			agentID: msisdn,
			flag,
		});
	}

	// ! clear cache when flag is 2;
	if (flag === 2) {
		client.del(sessionID);
	}

	// return XML response back to controller
	return sendResponse({
		sessionID,
		msisdn,
		starcode,
		menu: message,
		flag,
		timestamp,
	});
};

export default sessionManager;
