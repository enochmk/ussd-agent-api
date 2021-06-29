const sql = require('mssql');

const asyncHandler = require('../middleware/async');
const AgentMenu = require('../data/AgentMenu.json');
const sendXMLResponse = require('../utils/XMLResponse');
const Logger = require('../utils/Logger');
const { BSR_CONFIG } = require('../config/database');

// actions
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
	let nextPage = null;
	let sessions = null;
	let currentPage = null;
	let answers = null;
	let previousRow = null;
	req.requestID = requestID;

	Logger(`${requestID}|${agentID}|AgentMenu|request|${JSON.stringify(body)}`);

	// get previous session via MSISDN
	stmt = `SELECT ID, PAGE, ACTION FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}' ORDER BY ID DESC`;
	pool = await sql.connect(BSR_CONFIG);
	response = await pool.request().query(stmt);
	await pool.close();

	// ! if no session found; initiate new session
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
				action = 'bio_re_registration';
				break;
			case '3':
				action = 'bio_registration';
				break;
			case '4':
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

	// user has session; get all unique sessions in array
	sessions = response.recordset.map((index) => index.PAGE);
	sessions = sessions.filter(
		(value, index, categoryArray) => categoryArray.indexOf(value) === index
	);

	// Check if there an action has not been selected, re-initiate session
	currentPage = sessions[0]; // last page
	if (currentPage === 'welcome') {
		currentPage = 1; // default page

		menu = AgentMenu[action][currentPage];
		stmt = `INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${agentID}','${requestID}', '${currentPage}', 'awaiting input', '${action}')`;

		pool = await sql.connect(BSR_CONFIG);
		response = await pool.request().query(stmt);
		await pool.close();

		Logger(
			`${requestID}|${agentID}|AgentMenu|progress|1|Page: 1|${action}|${JSON.stringify(
				menu
			)}|'Awaiting input'`
		);

		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp)
		);
	}

	// Empty userdata string, return the same page.
	if (!userdata.length || USSD_CODE.includes(userdata)) {
		nextPage = parseInt(currentPage); // stay on the same page

		// Get the current Menu and show to user
		menu = AgentMenu[action][nextPage];
		Logger(
			`${requestID}|${agentID}|AgentMenu|progress|Resumed|Page:${nextPage}|${action}|${JSON.stringify(
				menu
			)}|'Awaiting input'`
		);

		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp)
		);
	}

	// increment next page
	nextPage = parseInt(currentPage) + 1;
	console.log(nextPage);

	// Update previous row with current userdata
	previousRow = response.recordset[0].ID;

	pool = await sql.connect(BSR_CONFIG);
	stmt = `UPDATE SIMREG_CORE_TBL_AGENT_USSD SET INPUT='${userdata}', ACTION='${action}'WHERE ID='${previousRow}'`;
	response = await pool.request().query(stmt);

	// ? Check if there's next page, return next page else end
	if (AgentMenu[action][nextPage]) {
		if (parseInt(nextPage) === 5) {
			stmt = `SELECT INPUT FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}' AND ACTION='${action}' ORDER BY ID ASC`;
			response = await pool.request().query(stmt);

			answers = response.recordset.map((index) => index.INPUT);
			menu = `You are registering nationalID: '${answers[2]}' for ${answers[0]} with receipt number: '${answers[3]}'\n1. Confirm\n2.Cancel`;
		} else {
			menu = AgentMenu[action][nextPage];
		}

		stmt = `INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${agentID}','${requestID}', '${nextPage}', 'awaiting input', '${action}')`;
		response = await pool.request().query(stmt);
		await pool.close();

		Logger(
			`${requestID}|${agentID}|AgentMenu|progress|Open|Page: ${nextPage}|${action}|${JSON.stringify(
				menu
			)}|'Awaiting input'`
		);

		return res.send(
			sendXMLResponse(sessionID, agentID, starcode, menu, 1, timestamp)
		);
	}

	// ? Session is over, get all inputs per action
	stmt = `SELECT INPUT FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${agentID}' AND ACTION='${action}' ORDER BY ID ASC`;
	response = await pool.request().query(stmt);
	await pool.close();

	answers = response.recordset.map((index) => index.INPUT);

	// Send Answers to answer function
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
	const menu = AgentMenu.welcome;

	const stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}'; INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${msisdn}','${requestID}','welcome', 'Awaiting input', null)`;

	const pool = await sql.connect(BSR_CONFIG);
	await pool.request().query(stmt);
	await pool.close();

	Logger(
		`${requestID}|${msisdn}|AgentMenu|progress|Open|Page: Welcome|${JSON.stringify(
			menu
		)}|'Awaiting input'`
	);

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
		`${requestID}|${msisdn}|AgentMenu|Ended|Closed|Page: Last|${JSON.stringify(
			menu
		)}|'Awaiting input'`
	);

	console.log(`${msisdn}: ${JSON.stringify(answers)}`);
	return sendXMLResponse(sessionID, msisdn, starcode, menu, 2, timestamp);
};

module.exports = AgentUSSD;
