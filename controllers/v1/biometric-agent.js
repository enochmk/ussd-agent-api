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

const AgentUSSD = asyncHandler(async (req, res, next) => {
	const body = req.body.ussddynmenurequest;

	// extract requestID, MSISDN, userData
	const requestID = req.requestID;
	const sessionID = body.requestid[0];
	const msisdn = body.msisdn[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	const userdata = body.userdata[0].trim();

	let stmt = null;
	let action = null;
	let message = null;
	let response = null;
	let nextPage = null;
	let sessions = null;
	let currentPage = null;
	let answers = null;
	let previousRow = null;

	req.requestID = requestID;

	Logger(`${requestID}|${msisdn}|AgentMenu|request|${JSON.stringify(body)}`);

	// get previous session via MSISDN
	stmt = `SELECT ID, PAGE, ACTION FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}' ORDER BY ID DESC`;
	response = await sql(stmt);

	// if no session found; initiate new session
	if (!response.recordset.length) {
		response = await initSession(
			requestID,
			sessionID,
			msisdn,
			starcode,
			1,
			timestamp
		);

		return res.send(response);
	}

	// user wants to cancel the session
	if (userdata === '#99' || userdata === '#') {
		response = await endSession(
			requestID,
			sessionID,
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
				response = await initSession(requestID, sessionID, msisdn, starcode, timestamp)
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
		stmt = `INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${msisdn}','${requestID}', '${currentPage}', 'awaiting input', '${action}')`;
		await sql(stmt);

		Logger(`${requestID}|${msisdn}|AgentMenu|progress|1|Page: 1|${action}|${JSON.stringify(menu)}|'Awaiting input'`);

		return res.send(
			sendXMLResponse(sessionID, msisdn, starcode, menu, 1, timestamp)
		);
	}

	// Empty userdata string, return the same page. 
	if (!userdata.length || USSD_CODE.includes(userdata)) {
		nextPage = parseInt(currentPage); // stay on the same page

		// Get the current Menu and show to user
		menu = AgentMenu[action][nextPage];
		Logger(`${requestID}|${msisdn}|AgentMenu|progress|Resumed|Page:${nextPage}|${action}|${JSON.stringify(menu)}|'Awaiting input'`);

		return res.send(
			sendXMLResponse(sessionID, msisdn, starcode, menu, 1, timestamp)
		);
	}

	// increment next page
	nextPage = parseInt(currentPage) + 1;

	// Update previous row with current userdata
	previousRow = response.recordset[0].ID;
	stmt = `UPDATE SIMREG_CORE_TBL_AGENT_USSD SET INPUT='${userdata}', ACTION='${action}'WHERE ID='${previousRow}'`;
	await sql(stmt);

	// Check if there's next page, return next page else end
	if (AgentMenu[action][nextPage]) {
		menu = AgentMenu[action][nextPage];
		stmt = `INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${msisdn}','${requestID}', '${nextPage}', 'awaiting input', '${action}')`;
		await sql(stmt);

		Logger(`${requestID}|${msisdn}|AgentMenu|progress|Open|Page: ${nextPage}|${action}|${JSON.stringify(menu)}|'Awaiting input'`);

		return res.send(
			sendXMLResponse(sessionID, msisdn, starcode, menu, 1, timestamp)
		);
	}

	// Session is over, get all inputs per action
	stmt = `SELECT INPUT FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}' AND ACTION='${action}' ORDER BY ID ASC`;
	response = await sql(stmt);
	answers = response.recordset.map((index) => index.INPUT);

	// Send Answers to answer function
	switch (action) {
		case "remote_registration":
			remote_registration(msisdn, answers, requestID);
			break;
		case "bio_re_registration":
			message = await bio_re_registration(msisdn, answers, requestID);
			break;
		case "bio_registration":
			message = await bio_registration(msisdn, answers, requestID);
			break;
		case "verify_customer_details":
			message = await verify_customer_details(msisdn, answers, requestID);
			break;
		default:
			break;
	}

	// No more menu to show, end session
	menu = message || AgentMenu.salute;

	response = await endSession(requestID, sessionID, msisdn, starcode, menu, timestamp, answers);
	res.send(response);
});

// add new session to database and set flag 1 (open)
const initSession = async (
	requestID,
	sessionID,
	msisdn,
	starcode,
	timestamp
) => {
	const menu = AgentMenu.welcome;

	stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}'; INSERT INTO SIMREG_CORE_TBL_AGENT_USSD (MSISDN, SESSION, PAGE, INPUT, ACTION) VALUES('${msisdn}','${requestID}','welcome', 'Awaiting input', null)`;
	await sql(stmt);

	Logger(`${requestID}|${msisdn}|AgentMenu|progress|Open|Page: Welcome|${JSON.stringify(menu)}|'Awaiting input'`);

	return sendXMLResponse(sessionID, msisdn, starcode, menu, 1, timestamp);
};

// clear session from database via MSISDN and set flag 2 (close)
const endSession = async (requestID, sessionID, msisdn, starcode, menu, timestamp, answers) => {
	stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN='${msisdn}';`;
	await sql(stmt);
	Logger(`${requestID}|${msisdn}|AgentMenu|Ended|Closed|Page: Last|${JSON.stringify(menu)}|'Awaiting input'`);


	console.log(`${msisdn}: ${JSON.stringify(answers)}`);
	return sendXMLResponse(sessionID, msisdn, starcode, menu, 2, timestamp);
};

module.exports = AgentUSSD;
