import moment from 'moment';
import Messages from '../constant/Messages.json';
import formatPinNumber from '../helper/formatPinNumber';

export default (sessions: Array<object>) => {
	const lastSession: any = sessions[sessions.length - 1];
	let success = true;
	let message = 'No error';

	/*1. Enter customer's MSISDN */
	if (lastSession.page === '1') {
		if (
			lastSession.userdata.length !== 10 &&
			lastSession.userdata.length !== 9
		) {
			success = false;
			message = Messages.invalidMSISDNLength;
		}
	}

	/*2. Enter last Six Digit of ICCID */
	if (lastSession.page === '2') {
		if (
			lastSession.userdata.length !== 6 &&
			lastSession.userdata.length !== 19
		) {
			success = false;
			message = Messages.invalidICCIDLength;
		}
	}

	/*3. Enter customer's Ghana card number(Eg: GHA-712456789-9) */
	if (lastSession.page === '3') {
		if (!formatPinNumber(lastSession.userdata)) {
			success = false;
			message = Messages.invalidGhanaCard;
		}
	}

	/*5. Select customer's gender\n1. Male\n2. Female */
	if (lastSession.page === '6') {
		if (!['1', '2'].includes(lastSession.userdata)) {
			success = false;
			message = Messages.invalidOption;
		}
	}

	/*6. Enter the customer's date of birth (DDMMYYYY) */
	if (lastSession.page === '7') {
		// birthdate length
		if (lastSession.userdata.length !== 8) {
			success = false;
			message = Messages.invalidDOBLength;
		}

		// Check if birthdate is valid
		if (lastSession.userdata.length === 8) {
			const dob = moment(lastSession.userdata, 'DDMMYYYY');
			if (!dob.isValid()) {
				success = false;
				message = Messages.invalidDOB;
			}
		}
	}

	/*5. Select customer's gender\n1. Male\n2. Female */
	if (lastSession.page === '8') {
		if (
			lastSession.userdata.length !== 10 &&
			lastSession.userdata.length !== 9
		) {
			success = false;
			message = Messages.invalidMSISDNLength;
		}
	}

	return {
		success,
		message,
	};
};
