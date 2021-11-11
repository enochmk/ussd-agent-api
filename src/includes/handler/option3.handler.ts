import { RedisClient } from 'redis';
import config from 'config';

import OptionResponse from '../../interface/OptionResponse';
import MainMenuJson from '../../constant/Menu.json';
import Messages from '../../constant/Messages.json';
import MenuInterface from '../../interface/Menu';
import { createSession } from '../../helper/session';
import SessionValidation from '../../validation/option3.validation';
import getSubscriberStatus from '../../api/getSubscriberStatus.api';
import formatPhoneNumber from '../../helper/formatPhoneNumber';
import { USSD } from '../../entity/Ussd';

const OPTION_NUMBER = '3';
const Menu: MenuInterface = MainMenuJson[OPTION_NUMBER];
const REDIS_EXPIRY: number = config.get('redisExpiry');
const KEYS = Object.keys(Menu);
const NAMESPACE = 'CHECK_SUBSCRIBER_STATUS';

/**
 * @description: Check for the registration status of a subscriber
 * @param: MSISDN
 * @param: redis Client
 */
const option3 = async (
	sessionID: string,
	msisdn: string,
	client: RedisClient
): Promise<OptionResponse> => {
	let sessions: any = null;
	let message = '';
	let page = '1';
	let flag = 1;

	sessions = await client.get(sessionID);
	sessions = JSON.parse(sessions);

	// ! Validate the session inputs */
	const isError = SessionValidation(sessions);
	if (!isError.success) {
		flag = 2;

		return {
			message: isError.message,
			flag,
		};
	}

	/* Iterate menu item */
	const lastSession = sessions[sessions.length - 1];
	const currentIndex = KEYS.indexOf(lastSession.page);
	if (KEYS[currentIndex + 1]) {
		const nextIndex = currentIndex + 1;
		page = KEYS[nextIndex];
		message = Menu[page];

		const MSISDN = formatPhoneNumber(lastSession.userdata);

		if (page === 'confirm') {
			message = message.replace('(MSISDN)', MSISDN);
		}

		// create the session for this question
		const session = createSession(
			sessionID,
			msisdn,
			message,
			OPTION_NUMBER,
			page,
			null
		);

		// push session to cache
		sessions.push(session);
		client.setex(sessionID, REDIS_EXPIRY, JSON.stringify(sessions));
	}

	// ? confirmation:
	if (lastSession.page === 'confirm') {
		if (!['1', '2'].includes(lastSession.userdata)) {
			message = Messages.invalidInput;
			flag = 2;
		}

		// * User has confirmed
		if (lastSession.userdata === '1') {
			message = Messages.onSubmit;
			flag = 2;

			// get the subscriber's MSISDN from the session
			const subscriberMSISDN = sessions[sessions.length - 2].userdata;

			// Save to database
			const ussd = new USSD();
			ussd.SESSION_ID = sessionID;
			ussd.AGENT_ID = msisdn;
			ussd.MSISDN = subscriberMSISDN;
			ussd.OPTION = NAMESPACE;
			ussd.CELLID = lastSession.cellID;
			await ussd.save();

			await getSubscriberStatus(
				sessionID,
				msisdn,
				subscriberMSISDN,
				lastSession.cellID
			)
				.then((data) => {
					message = data;
				})
				.catch((_) => {
					message = Messages.unknownError;
				});
		}

		// user has cancelled
		if (lastSession.userdata === '2') {
			message = Messages.onCancel;
			flag = 2;
		}
	}

	return {
		message: message,
		flag,
	};
};

export default option3;
