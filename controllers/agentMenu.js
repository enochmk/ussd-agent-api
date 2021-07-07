const sql = require('mssql');

const asyncHandler = require('../middleware/async');
const AgentMenu = require('../data/AgentMenu.json');
const sendXMLResponse = require('../utils/XMLResponse');
const Logger = require('../utils/Logger');
const { BSR_CONFIG } = require('../config/database');

// endpoint actions
const bioRegistration = require('./functions/bioRegistration');
const bioReRegistration = require('./functions/bioReRegistration');
const nonBioRegistration = require('./functions/nonBioRegistration');
const nonBioRegistrationMfs = require('./functions/nonBioRegistrationMfs');
const verifyCustomerDetails = require('./functions/verifyCustomerDetails');

// the initial code to begin session
const USSD_CODE = ['*460*46#', '*100*5#'];

const AgentUSSD = asyncHandler(async (req, res, next) => {
	const body = req.body.ussddynmenurequest;

	// extract requestID, MSISDN, userData
	const requestID = req.requestID;
	const sessionID = body.requestid[0];
	const agentID = body.msisdn[0];
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
	req.requestID = requestID;

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
				action = 'bio_re_registration';
				break;
			case '4':
				action = 'bio_registration';
				break;
			case '5':
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

	let keys = Object.keys(AgentMenu[action]);
	let values = Object.values(AgentMenu[action]);

	// user has session; get all unique sessions in array []
	sessions = response.recordset.map((index) => index.PAGE);
	sessions = sessions.filter(
		(value, index, categoryArray) => categoryArray.indexOf(value) === index
	);

	currentKey = sessions[0]; // get last index

	// Empty userdata string,  stay on the same page
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

	// increment to next page
	currentIndex = keys.indexOf(currentKey);
	nextIndex = currentIndex + 1;
	currentKey = keys[nextIndex]; // next currentKey in db

	// ? Customer Confirm Message
	if (keys[nextIndex] === 'confirm') {
		// get the answers to confirm
		stmt = `SELECT INPUT FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}' AND ACTION='${action}' ORDER BY ID ASC`;
		pool = await sql.connect(BSR_CONFIG);
		response = await pool.request().query(stmt);
		await pool.close();

		// array of strings [''];
		answers = response.recordset.map((index) => index.INPUT);

		if (action === 'verify_customer_details') {
			menu = `MSISDN: ${answers[1]}\n\nAre you sure you want to proceed?\n1.Confirm above the details\n2.Cancel`;
		} else if (action === 'non_bio_registration') {
			menu = `MSISDN: ${answers[1]}\nLast 6 Digit of ICCID: ${
				answers[2]
			}\nID: ${answers[3]}\nFirstNames: ${answers[4]}\nSurname: ${
				answers[5]
			}\nSex: ${answers[6] == 1 ? 'Male' : 'Female'}\nDOB: ${
				answers[7]
			}\nWant AirtelTigo Money?: ${
				answers[8] == 1 ? 'Yes' : 'No'
			}\nNext Of Kin: ${answers[9]}\n\n1.Confirm above the details\n2.Cancel`;
		} else if (action === 'non_bio_registration_mfs') {
			menu = `MSISDN: ${answers[1]}\nID: ${answers[2]}\nFirstNames: ${
				answers[3]
			}\nSurname: ${answers[4]}\nSex: ${
				answers[5] == 1 ? 'Male' : 'Female'
			}\nDOB: ${answers[6]}\nNext Of Kin: ${
				answers[7]
			}\n\n1.Confirm above the details \n2.Cancel`;
		} else if (action === 'bio_re_registration') {
			menu = `MSISDN: ${answers[1]}\nID: ${answers[2]}\nVerification Receipt NO: ${answers[3]}\n\n1.Confirm above the details \n2.Cancel`;
		} else if (action === 'bio_registration') {
			menu = `MSISDN: ${answers[1]}\nLast 6 Digit of ICCID: ${
				answers[2]
			}\nID: ${answers[3]}\nVerification Receipt NO: ${
				answers[4]
			}\nWant AirtelTigo Money?: ${
				answers[5] == 1 ? 'Yes' : 'No'
			}\nNext Of Kin: ${answers[6]}\n\n1.Confirm above the details \n2.Cancel`;
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

	// ? Session is over, get all inputs per action
	stmt = `SELECT INPUT FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}' AND ACTION='${action}' ORDER BY ID ASC`;
	pool = await sql.connect(BSR_CONFIG);
	response = await pool.request().query(stmt);
	await pool.close();

	// array of strings [''];
	answers = response.recordset.map((index) => index.INPUT);

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
		case 'bio_re_registration':
			message = await bioReRegistration(agentID, answers, requestID);
			break;
		case 'bio_registration':
			message = await bioRegistration(agentID, answers, requestID);
			break;
		case 'verify_customer_details':
			message = await verifyCustomerDetails(agentID, answers, requestID);
			break;
		default:
			break;
	}

	// * No more menu to show, end session
	menu = message || AgentMenu.salute;

	response = await endSession(
		requestID,
		sessionID,
		agentID,
		starcode,
		menu,
		timestamp,
		answers
	);

	res.send(response);
});

// ? add new session to database and set flag 1 (open)
const initSession = async (
	requestID,
	sessionID,
	agentID,
	starcode,
	timestamp
) => {
	const menu = AgentMenu.menu;
	const stmt = `
	DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}'; 
	INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${agentID}','${requestID}','menu', 'Awaiting input', null)`;

	const pool = await sql.connect(BSR_CONFIG);
	await pool.request().query(stmt);
	await pool.close();

	Logger(
		`${requestID}|${agentID}|AgentMenu|progress|Page: Menu|${JSON.stringify(
			menu
		)}|'Awaiting input'`
	);

	console.log(`${agentID}: ${JSON.stringify(menu)}`);
	return sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp);
};

// ? clear session from database via MSISDN and set flag 2 (close)
const endSession = async (
	requestID,
	sessionID,
	agentID,
	starcode,
	menu,
	timestamp,
	answers
) => {
	const stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}';`;
	const pool = await sql.connect(BSR_CONFIG);
	await pool.request().query(stmt);
	await pool.close();

	Logger(
		`${requestID}|${agentID}|AgentMenu|Ended|Page: Last|${JSON.stringify(menu)}`
	);

	console.log(`${agentID}: ${JSON.stringify(answers)}`);
	return sendXMLResponse(sessionID, agentID, starcode, menu, 2, timestamp);
};

module.exports = AgentUSSD;
