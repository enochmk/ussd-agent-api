const Menu = require('../menu.json');
const Messages = require('../utils/Messages.json');
const Session = require('../models/Session');
const sendXMLResponse = require('../utils/XMLResponse');

module.exports = async (option, sessionID, msisdn, starcode, timestamp) => {
	const questions = Menu[option];
	const keys = Object.keys(questions);
	let currentIndex = 0;
	let nextIndex = 0;
	let nextQuestion = null;
	let endSession = false;

	const sessions = await Session.find({ msisdn: msisdn, option: option }).sort({
		_id: 'desc',
	});

	if (sessions.length) {
		const lastSession = sessions[0];

		currentIndex = keys.indexOf(lastSession.page);
		nextIndex = currentIndex + 1;
	}

	// Check if there's a next question else finish
	if (questions[keys[nextIndex]]) {
		nextQuestion = questions[keys[nextIndex]];

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
		nextQuestion = Menu['finish'];
		await Session.deleteMany({ msisdn: msisdn });
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
