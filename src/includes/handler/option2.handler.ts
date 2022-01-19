import { RedisClient } from 'redis';
import config from 'config';
import moment from 'moment';

import OptionResponse from '../../interface/OptionResponse';
import MainMenuJson from '../../constant/Menu.json';
import Messages from '../../constant/Messages.json';
import MenuInterface from '../../interface/Menu';
import { createSession } from '../../helper/session';
import SessionValidation from '../../validation/option2.validation';
import formatPhoneNumber from '../../helper/formatPhoneNumber';
import formatPinNumber from '../../helper/formatPinNumber';
import MFSRegistrationInterface from '../../interface/MFSRegistration';
import SessionInterface from '../../interface/Session';
import MFSRegistrationAPI from '../../api/mfsRegistration.api';
import { USSD } from '../../entity/Ussd';

const OPTION_NUMBER = '2';
const Menu: MenuInterface = MainMenuJson[OPTION_NUMBER];
const REDIS_EXPIRY: number = config.get('redisExpiry');
const KEYS = Object.keys(Menu);
const NAMESPACE = 'MFS_REGISTRATION';

/**
 * @description: Check for the registration status of MSISDN
 * @param: MSISDN
 * @param: AgentID
 */
const option2 = async (
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

	/* Iterate menu item */
	const currentIndex = KEYS.indexOf(lastSession.page);
	if (KEYS[currentIndex + 1]) {
		const nextIndex = currentIndex + 1;
		page = KEYS[nextIndex];
		message = Menu[page];

		if (page === 'confirm') {
			let NOK = sessions[sessions.length - 1].userdata.toUpperCase();
			let ALT_NUMBER = sessions[sessions.length - 2].userdata.toUpperCase();
			let DOB = sessions[sessions.length - 3].userdata.toUpperCase();
			let SEX = sessions[sessions.length - 4].userdata.toUpperCase();
			let SURNAME = sessions[sessions.length - 5].userdata.toUpperCase();
			let FORENAMES = sessions[sessions.length - 6].userdata.toUpperCase();
			let PIN_NUMBER = sessions[sessions.length - 7].userdata.toUpperCase();
			let MSISDN = sessions[sessions.length - 8].userdata.toUpperCase();

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
			message = message.replace('(ALT_NUMBER)', ALT_NUMBER);
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
			flag = 2;

			const answers = sessions.map(
				(session: SessionInterface) => session.userdata
			);

			let data: MFSRegistrationInterface = {
				requestID: sessionID,
				agentID: msisdn,
				cellID: cellID || null,
				channelID: 'ussd',
				msisdn: answers[1],
				nationalID: formatPinNumber(answers[2].toUpperCase()) || '',
				forenames: answers[3].toUpperCase(),
				surname: answers[4].toUpperCase(),
				gender:
					answers[5] === '1' ? 'Male'.toUpperCase() : 'Female'.toUpperCase(),
				dateOfBirth: answers[6].toUpperCase(),
				alternative_number: answers[7].toUpperCase(),
				nextOfKin: answers[8].toUpperCase(),
			};

			// Save to database
			const ussd = new USSD();
			ussd.OPTION = NAMESPACE;
			ussd.SESSION_ID = data.requestID;
			ussd.AGENT_ID = data.agentID;
			ussd.MSISDN = data.msisdn.substr(data.msisdn.length - 9);
			ussd.DOB = data.dateOfBirth;
			ussd.FORENAMES = data.forenames;
			ussd.SURNAME = data.surname;
			ussd.CELLID = data.cellID || '';
			ussd.NEXTOFKIN = data.nextOfKin;
			ussd.PIN_NUMBER = data.nationalID;
			ussd.GENDER = data.gender;
			ussd.ALTERNATIVE_NUMBER = data.alternative_number;

			const record = await ussd.save();

			// Call external API and handle error exception
			try {
				const text = await MFSRegistrationAPI(sessionID, msisdn, data);
				message = text;
				await USSD.update(record.ID, { RESPONSE: text });
			} catch (error: any) {
				message = Messages.unknownError;
				await USSD.update(record.ID, { RESPONSE: error.message });
			}
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

export default option2;
