const sql = require('mssql');
const moment = require('moment');

const asyncHandler = require('../middleware/async');
const AgentMenu = require('../data/AgentMenu.json');
const sendXMLResponse = require('../utils/XMLResponse');
const Logger = require('../utils/Logger');
const Messages = require('../data/Messages.json');
const { BSR_CONFIG } = require('../config/database');
const {
	confirmMenuBioReg,
	confirmMenuNonBioReg,
	confirmMenuNonBioRegMFS,
} = require('../utils/DisplayMenu');
const { endSession, initSession } = require('../utils/sessions');

// endpoint actions
const verifyCustomerDetails = require('./functions/verifyCustomerDetails');
const formatGhanaCard = require('../utils/formatGhanaCard');
const nonBioRegistration = require('./functions/nonBioRegistration');
const nonBioRegistrationMfs = require('./functions/nonBioRegistrationMfs');

// the initial code to begin session
const USSD_CODE = ['*460*46#', '*100*5#'];

const AgentUSSD = asyncHandler(async (req, res, next) => {
	const requestID = req.requestID;

	const body = req.body.ussddynmenurequest;

	// extract requestID, MSISDN, userData
	const agentID = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	const userdata = body.userdata[0].trim();

	let stmt = null;
	let pool = null;
	let action = null;
	let message = null;
	let response = null;
	let nextIndex = null;
	let sessions = null;
	let currentKey = null;
	let currentIndex = null;
	let answers = null;
	let previousRow = null;

	Logger(`${requestID}|${agentID}|AgentMenu|request|${JSON.stringify(body)}`);

	// get previous session via MSISDN
	stmt = `SELECT ID, PAGE, ACTION FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}' ORDER BY ID DESC`;
	pool = await sql.connect(BSR_CONFIG);
	response = await pool.request().query(stmt);
	await pool.close();

	// ! initiate new session
	if (!response.recordset.length) {
		response = await initSession(
			requestID,
			sessionID,
			agentID,
			starcode,
			1,
			timestamp
		);

		return res.send(response);
	}

	// ! user wants to cancel the session
	if (userdata === '#99' || userdata === '#') {
		response = await endSession(
			requestID,
			sessionID,
			agentID,
			starcode,
			'Process cancelled',
			timestamp,
			[]
		);

		console.log(`${agentID}: ${JSON.stringify('Process Cancelled')}`);
		return res.send(response);
	}

	// No action selected
	if (!response.recordset[0].ACTION) {
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
				response = await initSession(
					requestID,
					sessionID,
					agentID,
					starcode,
					timestamp
				);

				return res.send(response);
		}
	} else {
		action = response.recordset[0].ACTION;
	}

	const keys = Object.keys(AgentMenu[action]);
	const values = Object.values(AgentMenu[action]);

	// user has session; get all unique sessions in array []
	sessions = response.recordset.map((index) => index.PAGE);
	sessions = sessions.filter(
		(value, index, categoryArray) => categoryArray.indexOf(value) === index
	);

	// Current Session Key
	currentKey = sessions[0];

	// ? Empty userdata string,  stay on the same page
	if (!userdata.length || USSD_CODE.includes(userdata)) {
		currentIndex = keys.indexOf(currentKey);
		menu = values[currentIndex];

		Logger(
			`${requestID}|${agentID}|AgentMenu|resumed|Page:${currentIndex}|${action}|${JSON.stringify(
				menu
			)}|'Awaiting input'`
		);

		console.log(`${agentID}: RESUME|${JSON.stringify(menu)}`);
		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp)
		);
	}

	// Update previous row with current userdata
	previousRow = response.recordset[0].ID;
	stmt = `UPDATE SIMREG_CORE_TBL_AGENT_USSD SET INPUT='${userdata}', ACTION='${action}'WHERE ID='${previousRow}'`;
	pool = await sql.connect(BSR_CONFIG);
	response = await pool.request().query(stmt);
	await pool.close();

	// Check if there an action has not been selected, re-initiate session
	if (currentKey === 'menu') {
		// default key
		currentKey = '1';

		currentIndex = keys.indexOf(currentKey);
		menu = values[currentIndex];

		stmt = `
		INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION)
		VALUES('${agentID}','${requestID}', '${currentKey}', 'awaiting input', '${action}')
		`;

		pool = await sql.connect(BSR_CONFIG);
		response = await pool.request().query(stmt);
		await pool.close();

		Logger(
			`${requestID}|${agentID}|AgentMenu|progress|Page: ${currentKey}|${action}|${JSON.stringify(
				menu
			)}|'Awaiting input'`
		);

		console.log(`${agentID}: ${JSON.stringify(menu)}`);
		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp)
		);
	}

	/***************************
	 * ? GET THE INPUTS        *
	 ***************************/
	stmt = `SELECT INPUT FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}' AND ACTION='${action}' ORDER BY ID ASC`;
	pool = await sql.connect(BSR_CONFIG);
	response = await pool.request().query(stmt);
	await pool.close();

	// store in array [];
	answers = response.recordset.map((index) => index.INPUT);
	console.log(answers);

	// increment to next page
	currentIndex = keys.indexOf(currentKey);
	nextIndex = currentIndex + 1;
	currentKey = keys[nextIndex];

	// ! Validate Ghana Card Number
	if (currentKey === '4' && action === 'non_bio_registration') {
		// Non Bio registration Check
		if (!formatGhanaCard(answers[3])) {
			const message = Messages.invalidInput;
			console.log(`${agentID}: ${JSON.stringify(message)}`);

			response = await endSession(
				requestID,
				sessionID,
				agentID,
				starcode,
				message,
				timestamp,
				answers
			);

			return res.send(response);
		}
	}

	// ! validate BirthDate
	if (currentKey === '7' && action === 'non_bio_registration') {
		const dob = moment(answers[6], 'DDMMYYYY').format('DD/MM/YYYY');
		answers[6] = dob;
	}

	// ! validate if customer wants MFS
	if (currentKey == '9' && action === 'non_bio_registration') {
		if (answers[8] === '2') {
			stmt = `
			INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION)
			VALUES('${agentID}','${requestID}', '${currentKey}', '', '${action}')`;

			pool = await sql.connect(BSR_CONFIG);
			response = await pool.request().query(stmt);
			await pool.close();

			// skip next question
			nextIndex++;
			currentKey = keys[nextIndex];
		}
	}

	// Confirmation
	if (keys[nextIndex] === 'confirm') {
		// ? Customer Confirm Message
		if (action === 'verify_customer_details') {
			menu = `MSISDN: ${answers[1]}\nAre you sure you want to proceed?\n1.Confirm above the details\n2.Cancel`;
		} else if (action === 'non_bio_registration') {
			menu = confirmMenuNonBioReg(answers);
		} else if (action === 'non_bio_registration_mfs') {
			menu = confirmMenuNonBioRegMFS(answers);
		} else if (action === 'bio_re_registration') {
			menu = confirmMenuBioReg(answers);
		} else if (action === 'bio_registration') {
		} else {
			menu = values[nextIndex];
		}

		stmt = `
			INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION)
			VALUES('${agentID}','${requestID}', '${currentKey}', 'awaiting input', '${action}')`;

		pool = await sql.connect(BSR_CONFIG);
		response = await pool.request().query(stmt);
		await pool.close();

		console.log(`${agentID}: ${JSON.stringify(menu)}`);
		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp)
		);
	}

	// ? Check if there's next page, return next page
	if (values[nextIndex]) {
		menu = values[nextIndex];

		stmt = `
			INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION)
			VALUES('${agentID}','${requestID}', '${currentKey}', 'awaiting input', '${action}')`;

		pool = await sql.connect(BSR_CONFIG);
		response = await pool.request().query(stmt);
		await pool.close();

		Logger(
			`${requestID}|${agentID}|AgentMenu|progress|Page: ${nextIndex}|${action}|${JSON.stringify(
				menu
			)}|'Awaiting input'`
		);

		console.log(`${agentID}: ${JSON.stringify(menu)}`);
		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp)
		);
	}

	// ! Check if confirmation is cancelled
	const confirmation = answers[answers.length - 1];
	if (parseInt(confirmation) === 2) {
		response = await endSession(
			requestID,
			sessionID,
			agentID,
			starcode,
			'Confirmation has been cancelled',
			timestamp,
			answers
		);

		return res.send(response);
	}

	// * Request Complete -> Send Answers to respective actions
	switch (action) {
		case 'non_bio_registration':
			nonBioRegistration(agentID, answers, requestID);
			break;
		case 'non_bio_registration_mfs':
			nonBioRegistrationMfs(agentID, answers, requestID);
			break;
		case 'verify_customer_details':
			message = await verifyCustomerDetails(agentID, answers, requestID);
			break;
		default:
			break;
	}

	menu = message || AgentMenu.salute;

	// * Send Message and end session
	response = await endSession(
		requestID,
		sessionID,
		agentID,
		starcode,
		menu,
		timestamp,
		answers
	);

	// end
	res.send(response);
});

module.exports = AgentUSSD;
