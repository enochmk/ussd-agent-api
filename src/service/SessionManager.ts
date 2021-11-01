import redis, { RedisClient } from 'redis';
import config from 'config';
import Menu from '../constant/Menu.json';
import util from 'util';
import MenuRequest from '../interface/MenuRequest';
import sendResponse from '../helper/SendResponse';
import Messages from '../constant/Messages.json';
import { createSession } from './includes/session';

export default (data: MenuRequest) => {
	// connect to redis Once!
	const client: RedisClient = redis.createClient(config.get('redisPort'));
	const REDIS_EXPIRY = <number>config.get('redisExpiry');
	client.get = <any>util.promisify(client.get);
	client.del = <any>util.promisify(client.del);

	const USSD_CODE = ['*460*55#', '*474#'];
	const END_CODE = ['00', '99'];
	const BACK_CODE = ['#'];

	const sessionID = data.sessionID;
	const starcode = data.starcode;
	const userdata = data.userdata;
	const timestamp = data.timestamp;
	const msisdn = Number(
		data.msisdn.toString().substr(data.msisdn.toString().length - 9)
	);

	let sessions = [];
	let page = '0';
	let flag = 1;
	let message = Messages.invalidInput;
	let session = createSession(sessionID, msisdn, Menu[0], page, null);

	// push session to cache
	sessions.push(session);
	client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));

	return sendResponse({
		sessionID,
		msisdn,
		starcode,
		menu: Menu[0],
		flag: 0,
		timestamp,
	});
};
