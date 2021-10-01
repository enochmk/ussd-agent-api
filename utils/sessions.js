const sql = require('mssql');
const AgentMenu = require('../data/AgentMenu.json');
const sendXMLResponse = require('./XMLResponse');

const { BSR_CONFIG } = require('../config/database');
const Logger = require('../utils/Logger');

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
	// await pool.close();

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
	const stmt = `DELETE FROM SIMREG_CORE_TBL_AGENT_USSD WHERE MSISDN LIKE '%${agentID}%';`;
	const pool = await sql.connect(BSR_CONFIG);
	await pool.request().query(stmt);
	// await pool.close();

	Logger(
		`${requestID}|${agentID}|AgentMenu|Ended|Last|${JSON.stringify(
			menu
		)}|${JSON.stringify(answers)}`
	);

	console.log(`${agentID}: ${JSON.stringify(answers)}`);
	return sendXMLResponse(sessionID, agentID, starcode, menu, 2, timestamp);
};

module.exports = {
	initSession,
	endSession,
};
