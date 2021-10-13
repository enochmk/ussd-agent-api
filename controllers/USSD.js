const Menu = require('../menu.json');
const Messages = require('../utils/Messages.json');
const Session = require('../models/Session');
const sendXMLResponse = require('../utils/XMLResponse');
const asyncHandler = require('../middleware/async');
const registrationHandler = require('../functions/option1');
const registrationMFSHandler = require('../functions/option2');
const verifyCustomerHandler = require('../functions/option3');

/**
 * @description: USSD agent menu for performing non biometric registration/reregistration
 */
const USSD = asyncHandler(async (req, res, _) => {
	const requestID = req.requestID;
	const USSD_CODE = ['*460*55#', '*474#'];
	const END_CODE = ['00', '99'];
	const BACK_CODE = ['#'];

	const body = req.body.ussddynmenurequest;
	const msisdn = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	let userdata = body.userdata[0].trim();

	// get latest sessions
	let sessions = await Session.find({ msisdn: msisdn }).sort({ _id: 'desc' });

	// sessions empty; start a new session
	if (!sessions.length) {
		const key = 'start';

		await Session.create({
			sessionID: sessionID,
			msisdn: msisdn,
			option: null,
			page: null,
			question: JSON.stringify(Menu[key]),
			answer: null,
		});

		return res.send(
			sendXMLResponse(sessionID, msisdn, starcode, Menu[key], 1, timestamp)
		);
	}

	// Go Back
	if (BACK_CODE.includes(userdata)) {
		const ID = sessions[0]._id;

		if (sessions.length > 1) {
			await Session.deleteOne({ _id: ID });
			sessions.shift();

			// unset userdata
			userdata = null;
		}
	}

	// USSD Code
	if (USSD_CODE.includes(userdata)) {
		await Session.deleteMany({ msisdn: msisdn });

		const key = 'start';

		await Session.create({
			sessionID: sessionID,
			msisdn: msisdn,
			option: null,
			page: null,
			question: JSON.stringify(Menu[key]),
			answer: null,
		});

		return res.send(
			sendXMLResponse(sessionID, msisdn, starcode, Menu[key], 1, timestamp)
		);
	}

	// End current session if userdata enters END_CODE
	if (END_CODE.includes(userdata)) {
		await Session.deleteMany({ msisdn: msisdn });

		return res.send(
			sendXMLResponse(
				sessionID,
				msisdn,
				starcode,
				Messages.onCancel,
				2,
				timestamp
			)
		);
	}

	// Get the last session
	const lastSession = sessions[0];
	let option = lastSession.option;

	// if userdata is empty, return the same question
	if (!userdata || userdata.length === 0) {
		return res.send(
			sendXMLResponse(
				sessionID,
				msisdn,
				starcode,
				lastSession.question.toString(),
				1,
				timestamp
			)
		);
	}

	// Current session does not have a selected option (start Menu)
	if (option === null) {
		switch (userdata) {
			case '1':
				option = 'non_bio_registration';
				break;
			case '2':
				option = 'non_bio_registration_mfs';
				break;
			case '3':
				option = 'verify_customer_details';
				break;
			default:
				// invalid input
				return res.send(
					sendXMLResponse(
						sessionID,
						msisdn,
						starcode,
						lastSession.question.toString(),
						1,
						timestamp
					)
				);
		}
	}

	// Update the last record
	lastSession.answer = userdata;
	await Session.updateOne({ _id: lastSession._id }, lastSession);

	let optionHandler = null;
	switch (option) {
		case 'non_bio_registration':
			optionHandler = await registrationHandler(
				option,
				sessionID,
				msisdn,
				starcode,
				timestamp
			);
			break;
		case 'non_bio_registration_mfs':
			optionHandler = await registrationMFSHandler(
				option,
				sessionID,
				msisdn,
				starcode,
				timestamp
			);
			break;
		case 'verify_customer_details':
			optionHandler = await verifyCustomerHandler(
				option,
				sessionID,
				msisdn,
				starcode,
				timestamp
			);
			break;
		default:
			await Session.deleteMany({ msisdn: msisdn });
			return res.send(
				sendXMLResponse(
					sessionID,
					msisdn,
					starcode,
					Messages.invalidSession,
					2,
					timestamp
				)
			);
	}

	return res.send(optionHandler);
});

module.exports = USSD;
