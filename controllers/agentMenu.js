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
			timestamp
		);

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
			menu = `Customer's MSISDN: ${answers[1]}
			Are you sure you want to proceed? 
			1.Confirm 
			2.Cancel`;
		} else if (action === 'non_bio_registration') {
			menu = `
			Customer's MSISDN: ${answers[1]}
			Last 6 Digit of ICCID: ${answers[2]}
			Customer's Ghana Card Number: ${answers[3]}
			Customer's FirstNames: ${answers[4]}
			Customer's Surname: ${answers[5]}
			Customer's Gender: ${answers[6] == 1 ? 'Male' : 'Female'}
			Customer's DOB: ${answers[7]}
			Want AirtelTigo Money?: ${answers[8] == 1 ? 'Yes' : 'No'}
			Next Of Kin: ${answers[9]}
			1.Confirm
			2.Cancel`;
		} else if (action === 'non_bio_registration_mfs') {
			menu = `
			Customer's MSISDN: ${answers[1]}
			Customer's Ghana Card Number: ${answers[2]}
			Customer's FirstNames: ${answers[3]}
			Customer's Surname: ${answers[4]}
			Customer's Gender: ${answers[5] == 1 ? 'Male' : 'Female'}
			Customer's DOB: ${answers[6]}
			Next Of Kin: ${answers[7]}
			1.Confirm 
			2.Cancel`;
		} else if (action === 'bio_re_registration') {
			menu = `
			Customer's MSISDN: ${answers[1]}\n
			Customer's Ghana Card Number: ${answers[2]}\n
			Verification Receipt Number: ${answers[3]}\n
			1.Confirm \n
			2.Cancel`;
		} else if (action === 'bio_registration') {
			menu = `
			Customer's MSISDN: ${answers[1]}\n
			Last 6 Digit of ICCID: ${answers[2]}\n
			Customer's Ghana Card Number: ${answers[3]}\n
			Verification Receipt Number: ${answers[4]}\n
			Want AirtelTigo Money?: ${answers[5] == 1 ? 'Yes' : 'No'}\n
			Next Of Kin: ${answers[6]}\n
			1.Confirm \n
			2.Cancel`;
		} else {
			menu = values[nextIndex];
		}

		stmt = `
			INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION)
			VALUES('${agentID}','${requestID}', '${currentKey}', 'awaiting input', '${action}')`;

		pool = await sql.connect(BSR_CONFIG);
		response = await pool.request().query(stmt);
		await pool.close();

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
	msisdn,
	starcode,
	timestamp
) => {
	const menu = AgentMenu.menu;
	const stmt = `
	DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}'; 
	INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${msisdn}','${requestID}','menu', 'Awaiting input', null)`;

	const pool = await sql.connect(BSR_CONFIG);
	await pool.request().query(stmt);
	await pool.close();

	Logger(
		`${requestID}|${msisdn}|AgentMenu|progress|Page: Menu|${JSON.stringify(
			menu
		)}|'Awaiting input'`
	);

	console.log(`${msisdn}: ${JSON.stringify(menu)}`);
	return sendXMLResponse(sessionID, msisdn, starcode, menu, 1, timestamp);
};

// ? clear session from database via MSISDN and set flag 2 (close)
const endSession = async (
	requestID,
	sessionID,
	msisdn,
	starcode,
	menu,
	timestamp,
	answers
) => {
	const stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}';`;
	const pool = await sql.connect(BSR_CONFIG);
	await pool.request().query(stmt);
	await pool.close();

	Logger(
		`${requestID}|${msisdn}|AgentMenu|Ended|Page: Last|${JSON.stringify(menu)}`
	);

	console.log(`${msisdn}: ${JSON.stringify(answers)}`);
	return sendXMLResponse(sessionID, msisdn, starcode, menu, 2, timestamp);
};

module.exports = AgentUSSD;
