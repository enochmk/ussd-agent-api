import { RedisClient } from 'redis';
import config from 'config';

import OptionResponse from '../../interface/OptionResponse';
import MainMenuJson from '../../constant/Menu.json';
import Messages from '../../constant/Messages.json';
import MenuInterface from '../../interface/Menu';
import { createSession } from '../includes/session';
import Validation from '../../validation/ValidateOption3';

const optionNumber = '3';
const Menu: MenuInterface = MainMenuJson[optionNumber];
const REDIS_EXPIRY: number = config.get('redisExpiry');
const KEYS = Object.keys(Menu);

/**
 * @description: Check for the registration status of MSISDN
 * @param: MSISDN
 * @param: AgentID
 */
const option3 = async (
	sessionID: string,
	msisdn: string,
	client: RedisClient
): Promise<OptionResponse> => {
	let sessions: any = null;
	let question = '';
	let page = '1';
	let flag = 1;

	sessions = await client.get(sessionID);
	sessions = JSON.parse(sessions);

	const isError = Validation(sessions);
	if (!isError.success) {
		return {
			message: isError.message,
			flag,
		};
	}

	// ? Iterate menu item */
	const lastSession = sessions[sessions.length - 1];
	const currentIndex = KEYS.indexOf(lastSession.page);
	if (KEYS[currentIndex + 1]) {
		const nextIndex = currentIndex + 1;
		page = KEYS[nextIndex];
		question = Menu[page];

		if (page === 'confirm') {
			question = question.replace('{MSISDN}', lastSession.userdata);
		}

		// create the session for this question
		const session = createSession(
			sessionID,
			msisdn,
			question,
			optionNumber,
			page,
			null
		);

		// push session to cache
		sessions.push(session);
		client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));
	}

	// ? confirmation
	if (lastSession.page === 'confirm') {
		if (!['1', '2'].includes(lastSession.userdata)) {
			question = Messages.invalidInput;
			flag = 2;
		}

		// user has confirmed
		if (lastSession.userdata === '1') {
			question = Messages.onSubmit;
			flag = 2;
		}

		// user has cancelled
		if (lastSession.userdata === '2') {
			question = Messages.onCancel;
			flag = 2;
		}
	}

	return {
		message: question,
		flag,
	};
};

export default option3;
