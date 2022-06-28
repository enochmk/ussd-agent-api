import { RedisClient } from 'redis';
import config from 'config';
import moment from 'moment';

import OptionResponse from '../../interface/OptionResponse';
import MainMenuJson from '../../constant/Menu.json';
import Messages from '../../constant/Messages.json';
import MenuInterface from '../../interface/Menu';
import { createSession } from '../../helper/session';
import SessionValidation from '../../validation/option1.validation';
import formatPhoneNumber from '../../helper/formatPhoneNumber';
import formatPinNumber from '../../helper/formatPinNumber';
import RegistrationAPI from '../../api/registration.api';
import RegistrationInterface from '../../interface/Registration';
import SessionInterface from '../../interface/Session';

const OPTION_NUMBER = '1';
const Menu: MenuInterface = MainMenuJson[OPTION_NUMBER];
const REDIS_EXPIRY: number = config.get('redisExpiry');
const KEYS = Object.keys(Menu);
const NAMESPACE = 'REGISTRATION';

/**
 * @description: Check for the registration status of MSISDN
 * @param: MSISDN
 * @param: AgentID
 */
const option1 = async (
	sessionID: string,
	msisdn: string,
	cellID: string,
	client: RedisClient
): Promise<OptionResponse> => {
	let sessions: any = null;
	let message = '';
	let page = '1';
	let flag = 1;

	sessions = await client.get(sessionID);
	sessions = JSON.parse(sessions);
	const lastSession = sessions[sessions.length - 1];

	// ! Validate the session inputs */
	const isError = SessionValidation(sessions);
	if (!isError.success) {
		flag = 1;

		return {
			message: `${isError.message}\n${lastSession.question}`,
			flag,
		};
	}

	/* ? Iterate menu item */
	const currentIndex = KEYS.indexOf(lastSession.page);
	if (KEYS[currentIndex + 1]) {
		const nextIndex = currentIndex + 1;
		page = KEYS[nextIndex];
		message = Menu[page];

		// * Final Question
		if (page === 'confirm') {
			let NOK = sessions[sessions.length - 1].userdata.toUpperCase();
			let ALT_NUMBER = sessions[sessions.length - 2].userdata.toUpperCase();
			let DOB = sessions[sessions.length - 3].userdata.toUpperCase();
			let SEX = sessions[sessions.length - 4].userdata.toUpperCase();
			let SURNAME = sessions[sessions.length - 5].userdata.toUpperCase();
			let FORENAMES = sessions[sessions.length - 6].userdata.toUpperCase();
			let PIN_NUMBER = sessions[sessions.length - 7].userdata.toUpperCase();
			let ICCID = sessions[sessions.length - 8].userdata.toUpperCase();
			let MSISDN = sessions[sessions.length - 9].userdata.toUpperCase();

			SEX = SEX === '1' ? 'Male' : 'Female';
			DOB = moment(DOB, 'DDMMYYYY').format('DD-MM-YYYY');
			MSISDN = formatPhoneNumber(MSISDN);
			ALT_NUMBER = formatPhoneNumber(ALT_NUMBER);
			PIN_NUMBER = formatPinNumber(PIN_NUMBER);

			/* Modify the confirmation question */
			message = message.replace('(MSISDN)', MSISDN);
			message = message.replace('(ID)', PIN_NUMBER);
			message = message.replace('(FORENAMES)', FORENAMES);
			message = message.replace('(SURNAME)', SURNAME);
			message = message.replace('(SEX)', SEX);
			message = message.replace('(DOB)', DOB);
			message = message.replace('(NOK)', NOK);
			message = message.replace('(ICCID)', ICCID);
			if (ALT_NUMBER === '1') {
				message = message.replace('Alt. No: (ALT_NUMBER)\n', '');
			} else {
				message = message.replace('(ALT_NUMBER)', ALT_NUMBER);
			}
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

	// ? confirmation
	if (lastSession.page === 'confirm') {
		if (!['1', '2'].includes(lastSession.userdata)) {
			message = Messages.invalidInput;
			flag = 2;
		}

		// user has CONFIRMED *
		if (lastSession.userdata === '1') {
			message = Messages.onSubmit;
			flag = 1;

			const answers = sessions.map(
				(session: SessionInterface) => session.userdata
			);

			let data: RegistrationInterface = {
				requestID: sessionID,
				agentID: msisdn,
				cellID: cellID,
				channelID: 'ussd',
				isMFS: true,
				msisdn: answers[1],
				iccid: answers[2],
				docNumber: answers[3].toUpperCase(),
				forenames: answers[4].toUpperCase(),
				surname: answers[5].toUpperCase(),
				gender:
					answers[6] === '1' ? 'Male'.toUpperCase() : 'Female'.toUpperCase(),
				dateOfBirth: answers[7],
				alternativeNumber: answers[8] === '1' ? '' : answers[8],
				nextOfKin: answers[9].toUpperCase(),
			};

			// Call external API and handle error exception
			try {
				const text = await RegistrationAPI(sessionID, msisdn, data);
				message = text;
			} catch (error: any) {
				console.log(error);

				message = error;
			}
		}

		// user has CANCELLED *
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

export default option1;
