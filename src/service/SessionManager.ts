import redis, { RedisClient } from 'redis';
import config from 'config';
import util from 'util';

import Messages from '../constant/Messages.json';
import MenuJson from '../constant/Menu.json';
import MenuInterface from '../interface/Menu';
import MenuRequest from '../interface/MenuRequest';
import sendResponse from '../helper/SendResponse';
import { createSession } from './includes/session';
import optionHandler from './includes/optionHandler';

const REDIS_EXPIRY = <number>config.get('redisExpiry');
const REDIS_PORT = <number>config.get('redisPort');
const MAIN_BUTTON = ['00'];
const BACK_BUTTON = ['#'];

const sessionManager = async (menuRequest: MenuRequest) => {
	const Menu: MenuInterface = MenuJson;

	// ?connect to redis only Once!
	const client: RedisClient = redis.createClient(REDIS_PORT);
	client.get = <any>util.promisify(client.get);
	client.del = <any>util.promisify(client.del);

	const sessionID = menuRequest.sessionID;
	const starcode = menuRequest.starcode;
	const userdata = menuRequest.userdata;
	const timestamp = menuRequest.timestamp;
	let msisdn = menuRequest.msisdn.toString();
	msisdn = msisdn.substr(msisdn.length - 9);

	let sessions = [];
	let page = '0';
	let flag = 1;
	let message = Messages.invalidInput;
	let response = null;

	// get session from cache
	const data = <any>await client.get(sessionID);

	// Does session exist or go to MAIN
	if (!data || MAIN_BUTTON.includes(userdata)) {
		// if MAIN button is parsed and
		if (MAIN_BUTTON.includes(userdata)) {
			await client.del(sessionID);
		}

		let question = Menu[page];
		let session = createSession(sessionID, msisdn, question, null, null, null);

		// push session to cache
		sessions.push(session);
		client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));

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

	// get the last session in the array
	let lastSession = <any>sessions[sessions.length - 1];

	// ? Handle empty userdata
	if (!userdata) {
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
	if (BACK_BUTTON.includes(userdata) && sessions.length > 1) {
		// remove last item in array;
		sessions.pop();
		client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));

		// get new latest item
		const lastSession = sessions[sessions.length - 1];

		// If lastSession is menu page, remove the page value
		if (sessions.length === 1) {
			lastSession.page = null;
			lastSession.option = null;
			lastSession.userdata = null;
			sessions[0] = lastSession;

			client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));
		}

		return sendResponse({
			sessionID,
			msisdn,
			starcode,
			menu: lastSession.question,
			flag: 1,
			timestamp,
		});
	}

	// Update previous data && define the option
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
	}

	// ! clear cache when flag is 2;
	if (flag === 2) {
		client.del(sessionID);
	}

	return sendResponse({
		sessionID,
		msisdn,
		starcode,
		menu: message,
		flag: 2,
		timestamp,
	});
};

export default sessionManager;
