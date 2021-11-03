const Menu = require('../menu.json');
const Messages = require('../utils/Messages.json');
const Session = require('../models/Session');
const sendXMLResponse = require('../utils/XMLResponse');
const verifyCustomerAPI = require('../api/verifyCustomerDetails');

module.exports = async (
	option,
	sessionID,
	msisdn,
	starcode,
	timestamp,
	cellID
) => {
	const questions = Menu[option];
	const keys = Object.keys(questions);
	let currentIndex = 0;
	let nextIndex = 0;
	let nextQuestion = null;
	let endSession = false;
	let data = {};
	let lastSession = {
		page: null,
		answer: null,
		question: null,
	};

	// get all sessions for this MSISDN
	const sessions = await Session.find({ msisdn: msisdn, option: option }).sort({
		_id: 'desc',
	});

	// init an array of answers in desc order
	const answers = sessions.map((session) => session.answer);

	// this MSISDN has session, use the latest session
	if (sessions.length) {
		lastSession = sessions[0];
		currentIndex = keys.indexOf(lastSession.page);
		nextIndex = currentIndex + 1;
	}

	/************************************************************************
	 **@description Validate
	 ***********************************************************************/
	const validateResponse = await validateLastSession(lastSession, nextIndex);
	if (validateResponse.error === true) {
		return sendXMLResponse(
			sessionID,
			msisdn,
			starcode,
			validateResponse.question,
			1,
			timestamp
		);
	}
	/************************************************************************/
	// Check if there's a next question else finish
	if (questions[keys[nextIndex]]) {
		nextQuestion = questions[keys[nextIndex]];

		// confirm
		if (keys[nextIndex] === 'confirm') {
			answers.reverse();
			data.MSISDN = answers[0];
			nextQuestion = nextQuestion.replace('(MSISDN)', data.MSISDN);
		}

		// ask the next question
		await Session.create({
			sessionID: sessionID,
			msisdn: msisdn,
			option: option,
			page: keys[nextIndex],
			question: JSON.stringify(nextQuestion),
			answer: null,
		});
	}

	// No more questions
	if (!questions[keys[nextIndex]]) {
		endSession = true;
		nextQuestion =
			lastSession.answer === '1' ? Menu['finish'] : Messages.onCancel;

		await Session.deleteMany({ msisdn: msisdn });
	}

	if (lastSession.page === 'confirm') {
		// * call API;
		if (lastSession.answer === '1') {
			answers.reverse();
			data.MSISDN = answers[0];
			verifyCustomerAPI(sessionID, msisdn, data.MSISDN, cellID);
		}
	}

	return sendXMLResponse(
		sessionID,
		msisdn,
		starcode,
		nextQuestion,
		endSession ? 2 : 1,
		timestamp
	);
};

/**
 * @description: Function to validate the last Session's Input
 */
const validateLastSession = async (lastSession) => {
	// ! Validate Customer's MSISDN
	if (lastSession.page === '1') {
		let customerMsisdn = lastSession.answer;
		customerMsisdn = customerMsisdn.substr(customerMsisdn.length - 9);
		if (customerMsisdn.length !== 9) {
			return {
				error: true,
				question: `Invalid MSISDN, try again.\n${lastSession.question.toString()}`,
			};
		}
	}

	return {
		error: false,
		question: null,
	};
};
