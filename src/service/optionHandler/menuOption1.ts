import { RedisClient } from 'redis';
import config from 'config';

import OptionResponse from '../../interface/OptionResponse';
import MainMenuJson from '../../constant/Menu.json';
import Messages from '../../constant/Messages.json';
import MenuInterface from '../../interface/Menu';
import { createSession } from '../includes/session';
import Validation from '../../validation/validateOption3';

const optionNumber = '1';
const Menu: MenuInterface = MainMenuJson[optionNumber];
const REDIS_EXPIRY: number = config.get('redisExpiry');
const KEYS = Object.keys(Menu);

/**
 * @description: Check for the registration status of MSISDN
 * @param: MSISDN
 * @param: AgentID
 */
const option1 = async (
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

	// const isError = Validation(sessions);
	// if (!isError.success) {
	// 	return {
	// 		message: isError.message,
	// 		flag,
	// 	};
	// }

	// ? Iterate menu item */
	const lastSession = sessions[sessions.length - 1];
	const currentIndex = KEYS.indexOf(lastSession.page);
	if (KEYS[currentIndex + 1]) {
		const nextIndex = currentIndex + 1;
		page = KEYS[nextIndex];
		question = Menu[page];

		// * Final Question
		if (page === 'confirm') {
			let NOK = sessions[sessions.length - 1].userdata.toUpperCase();
			let ATM = sessions[sessions.length - 2].userdata.toUpperCase();
			let DOB = sessions[sessions.length - 3].userdata.toUpperCase();
			let SEX = sessions[sessions.length - 4].userdata.toUpperCase();
			let SURNAME = sessions[sessions.length - 5].userdata.toUpperCase();
			let FORENAMES = sessions[sessions.length - 6].userdata.toUpperCase();
			let PIN_NUMBER = sessions[sessions.length - 7].userdata.toUpperCase();
			let ICCID = sessions[sessions.length - 8].userdata.toUpperCase();
			let MSISDN = sessions[sessions.length - 9].userdata.toUpperCase();

			SEX = SEX === '1' ? 'Male' : 'Female';
			ATM = ATM === '1' ? 'Yes' : 'No';

			/* Modify the confirmation question */
			question = question.replace('(MSISDN)', MSISDN);
			question = question.replace('(ID)', PIN_NUMBER);
			question = question.replace('(FORENAMES)', FORENAMES);
			question = question.replace('(SURNAME)', SURNAME);
			question = question.replace('(SEX)', SEX);
			question = question.replace('(DOB)', DOB);
			question = question.replace('(ATM)', ATM);
			question = question.replace('(NOK)', NOK);
			question = question.replace('(ICCID)', ICCID);
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

export default option1;
