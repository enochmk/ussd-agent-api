import Messages from '../constant/Messages.json';

export default (sessions: Array<object>) => {
	const lastSession: any = sessions[sessions.length - 1];
	let success = true;
	let message = 'No error';

	/* Enter Subscriber's MSISDN */
	if (lastSession.page === '1') {
		if (lastSession.userdata.length !== 10) {
			success = false;
			message = Messages.invalidMSISDNLength;
		}
	}

	return {
		success,
		message,
	};
};
