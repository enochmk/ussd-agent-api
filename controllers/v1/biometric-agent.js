const uuid = require('uuid').v4;

const asyncHandler = require('../../middleware/async');
const AgentMenu = require('../../data/AgentMenu.json');
const sendXMLResponse = require('../../utils/XMLResponse');
const Logger = require('../../utils/Logger');
const sql = require('../../database/db');

// actions
const bio_registration = require('./functions/bio-registration');
const remote_registration = require('./functions/remote-registration');
const bio_re_registration = require('./functions/bio-re-registration');
const verify_customer_details = require('./functions/verify-customer-details');

// the initial code to begin session
const USSD_CODE = ['*460*46#', '*100*5#'];

const BSR_CONFIG = {
	server: process.env.BSR_DB_HOST,
	user: process.env.BSR_DB_USER,
	database: process.env.BSR_DB_DATABASE,
	password: process.env.BSR_DB_PASSWORD,
	options: {
		enableArithAbort: true,
		trustedConnection: true,
		encrypt: true,
		enableArithAbort: true,
		trustServerCertificate: true,
	},
	pool: {
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000,
	},
};

const AgentUSSD = asyncHandler(async (req, res, next) => {
	const body = req.body.ussddynmenurequest;

	// extract requestID, MSISDN, userData
	const requestID = body.requestid[0];
	const msisdn = body.msisdn[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	const userdata = body.userdata[0];

	let stmt = null;
	let action = null;
	let message = null;
	let response = null;
	let nextPage = null;
	req.requestID = requestID;

	Logger(`${requestID}|AgentMenu|request|1|${action}|${nextPage}|${JSON.stringify(body)}|'Awaiting input'`);

	// get previous session via MSISDN
	stmt = `SELECT ID, PAGE, ACTION FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}' ORDER BY ID DESC`;
	response = await sql(stmt);

	// if no session found; initiate new session
	if (!response.recordset.length) {
		response = await initSession(
			requestID,
			msisdn,
			starcode,
			1,
			timestamp
		);

		return res.send(response);
	}

	// clear session 
	if (userdata === '#99') {
		response = await endSession(
			requestID,
			msisdn,
			starcode,
			"Process cancelled",
			timestamp
		);

		return res.send(response);
	}

	// No action selected
	if (!response.recordset[0].ACTION) {
		switch (userdata) {
			case '1':
				action = 'remote_registration';
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
				response = await initSession(requestID, msisdn, starcode, timestamp)
				return res.send(response);
		}
	} else {
		action = response.recordset[0].ACTION;
	}

	// Update previous row with current userdata
	const previousRow = response.recordset[0].ID;
	stmt = `UPDATE SIMREG_CORE_TBL_AGENT_USSD SET INPUT='${userdata}', ACTION='${action}'WHERE ID='${previousRow}'`;
	await sql(stmt);

	// user has session; get all sessions in array
	let sessions = response.recordset.map((index) => index.PAGE);

	// return unique session value
	sessions = sessions.filter(
		(value, index, categoryArray) => categoryArray.indexOf(value) === index
	);

	// Check if there an action has not been selected, re-initiate session
	const currentPage = sessions[0]; // last page

	if (currentPage === 'welcome') {
		nextPage = 1; // last page
	} else {
		if (USSD_CODE.includes(userdata)) {
			nextPage = parseInt(currentPage); // stay on the same page
		} else {
			nextPage = parseInt(currentPage) + 1; // last page
		}
	}

	// Check if there's next page;
	if (AgentMenu[action][nextPage]) {
		menu = AgentMenu[action][nextPage];

		stmt = `INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${msisdn}','${requestID}', '${nextPage}', 'awaiting input', '${action}')`;
		await sql(stmt);

		Logger(`${requestID}|AgentMenu|progress|1|${action}|${nextPage}|${JSON.stringify(menu)}|'Awaiting input'`);

		return res.send(
			sendXMLResponse(requestID, msisdn, starcode, menu, 1, timestamp)
		);
	}

	// Get answers 
	stmt = `SELECT INPUT FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}' AND ACTION='${action}' ORDER BY ID ASC`;
	response = await sql(stmt);

	// get answers into array
	let answers = response.recordset.map((index) => index.INPUT);

	// Send Answers to answer function
	switch (action) {
		case "remote_registration":
			remote_registration(msisdn, answers)
			break;
		case "bio_re_registration":
			message = await bio_re_registration(msisdn, answers)
			break;
		case "bio_registration":
			message = await bio_registration(msisdn, answers)
			break;
		case "verify_customer_details":
			message = await verify_customer_details(msisdn, answers)
			break;
		default:
			break;
	}

	Logger(`${requestID}|AgentMenu|ended|2|${action}|${nextPage}|${JSON.stringify(menu)}|${JSON.stringify(answers)}`);

	// No more menu to show, end session
	menu = message || AgentMenu.salute;
	response = await endSession(requestID, msisdn, starcode, menu, timestamp);
	res.send(response);
});


// add new session to database and set flag 1 (open)
const initSession = async (
	requestID,
	msisdn,
	starcode,
	timestamp
) => {
	const menu = AgentMenu.welcome;

	stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}'; INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${msisdn}','${requestID}','welcome', 'Awaiting input', null)`;

	await sql(stmt);

	Logger(`${requestID}|AgentMenu|progress|1|Welcome|1|${JSON.stringify(menu)}|'Awaiting input'`);

	return sendXMLResponse(requestID, msisdn, starcode, menu, 1, timestamp);
};

// clear session from database via MSISDN and set flag 2 (close)
const endSession = async (requestID, msisdn, starcode, menu, timestamp) => {
	stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}';`;
	await sql(stmt);

	Logger(`${requestID}|AgentMenu|Ended|1|End|2|${JSON.stringify(menu)}|'No input required'`);

	return sendXMLResponse(requestID, msisdn, starcode, menu, 2, timestamp);
};

module.exports = AgentUSSD;
