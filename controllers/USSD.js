const moment = require('moment');

const asyncHandler = require('../middleware/async');
const Menu = require('../menu.json');
const Session = require('../models/Session');
const sendXMLResponse = require('../utils/XMLResponse');
const formatGhanaCard = require('../utils/formatGhanaCard');
const Logger = require('../utils/Logger');
const Messages = require('../utils/Messages.json');

/**
 * @description: USSD agent menu for performing non biometric registration/reregistration
 */
const USSD = asyncHandler(async (req, res, _) => {
	const requestID = req.requestID;
	const USSD_CODE = ['*460*55#', '*474#'];
	const END_CODE = ['#', '99'];

	const body = req.body.ussddynmenurequest;
	const agentID = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	const userdata = body.userdata[0].trim();

	// check if subscriber have sessionID
	const sessions = await Session.find({ msisdn: agentID }).sort({
		$natural: -1,
	});

	// if no; start a new session and save to database
	if (!sessions.length || USSD_CODE.includes(userdata)) {
		let key = 'start';

		await Session.create({
			sessionID: sessionID,
			msisdn: agentID,
			option: null,
			page: null,
			question: JSON.stringify(Menu[key]),
			answer: null,
		});

		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, Menu[key], 1, timestamp)
		);
	}

	//? Get the last session
	const lastSession = sessions[0];
	let action = lastSession.option;
	let page = lastSession.page;

	// if userdata is empty, return the same question
	if (!userdata || userdata.length === 0) {
		return res.send(
			sendXMLResponse(
				sessionID,
				agentID,
				starcode,
				lastSession.question.toString(),
				1,
				timestamp
			)
		);
	}

	// end session if userdata is in END_CODE
	if (END_CODE.includes(userdata)) {
		await Session.deleteMany({ msisdn: agentID });

		return res.send(
			sendXMLResponse(
				sessionID,
				agentID,
				starcode,
				Messages.onCancel,
				2,
				timestamp
			)
		);
	}

	// no action selected
	if (action === null) {
		page = null;
		switch (userdata) {
			case '1':
				action = 'non_bio_registration';
				break;
			case '2':
				action = 'non_bio_registration_mfs';
				break;
			case '3':
				action = 'verify_customer_details';
				break;
			default:
				// invalid input
				return res.send(
					sendXMLResponse(
						sessionID,
						agentID,
						starcode,
						Messages.invalidInput,
						page === 'confirm' ? 2 : 1,
						timestamp
					)
				);
		}
	}

	//* *************************Previous Session*****************************************//
	// ? update the input of the last session
	lastSession.answer = userdata;
	await Session.updateOne({ _id: lastSession._id }, lastSession);
	//* **********************************************************************************//

	//* *************************Next Section Handler*************************************//
	let questions = Menu[action]; // questions for this action
	let nextQuestion = null;
	let endSession = false;
	let answers = await Session.find({ msisdn: agentID });

	// increment to the next key
	if (page !== null) {
		// convert to array of question numbers;
		const keys = Object.keys(questions);
		const currentIndex = keys.indexOf(page);
		const nextIndex = currentIndex + 1;

		// validation
		answers = answers.map((record) => record.answer);
		answers = answers.shift(); // remove first item (menu selection)

		// ? Validate Ghana Card is in correct format
		if (action === 'non_bio_registration' && page === '2') {
			if (!formatGhanaCard(lastSession.answer)) {
				return res.send(
					sendXMLResponse(
						sessionID,
						agentID,
						starcode,
						Messages.invalidGhanaCard,
						2,
						timestamp
					)
				);
			}
		}

		// // ? validate BirthDate
		if (action === 'non_bio_registration' && page === '6') {
			const dob = moment(answers[6], 'DDMMYYYY').format('DD/MM/YYYY');
			answers[6] = dob;
		}

		// // ? validate if customer wants MFS, if no skip this question
		if (action === 'non_bio_registration' && page === '7') {
			if (answers[7] === '2') {
				// skip next question
				nextIndex++;

				// create new session record
				let newSession = {
					msisdn: agentID,
					sessionID: sessionID,
					option: action,
					page: page,
					answer: 2,
					question: 'Create AirtelTigo Money\n1.Yes\n2.No',
				};

				await Session.create(newSession);
			}
		}

		// convert to array of questions
		questions = Object.values(questions);

		// Get the next question if available or else end the session
		if (questions[nextIndex]) {
			nextQuestion = questions[nextIndex];
			page = keys[nextIndex];
		} else {
			endSession = true;
		}
	} else {
		page = '1';
		nextQuestion = questions[page];
	}

	// ? continue to new session if end session is false
	if (!endSession) {
		// create new session record
		let newSession = {
			msisdn: agentID,
			sessionID: sessionID,
			option: action,
			page: page,
			answer: null,
			question: nextQuestion,
		};

		await Session.create(newSession);
	}
	//* **********************************************************************************//

	// get the answers and clear the sesion;
	if (endSession) {
		let answers = await Session.find({ msisdn: agentID });
		answers = answers.map((record) => record.answer);

		console.log(answers);
		await Session.deleteMany({ msisdn: agentID });
	}

	return res.send(
		sendXMLResponse(
			sessionID,
			agentID,
			starcode,
			endSession ? Messages.onSubmit : nextQuestion,
			endSession ? 2 : 1,
			timestamp
		)
	);
});

module.exports = USSD;
