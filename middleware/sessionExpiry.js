const moment = require('moment');
const sql = require('mssql');

const asyncHandler = require('./async');
const { BSR_CONFIG } = require('../config/database');
const Logger = require('../utils/Logger');

// grab the allocated time interval in minutes
const ALLOCATED_INTERVAL = process.env.ALLOCATED_INTERVAL;

const SessionExpiry = asyncHandler(async (req, res, next) => {
	const body = req.body.ussddynmenurequest;

	// extract requestID, MSISDN, userData
	const requestID = req.requestID;
	let msisdn = body.msisdn[0];

	msisdn = msisdn.substr(msisdn.length - 9);

	// get previous session via MSISDN
	let stmt = `SELECT TOP 1 ID, MSISDN, PAGE, TIMESTAMP FROM [SIMREG_CORE_TBL_AGENT_USSD] WHERE MSISDN LIKE '%${msisdn}%' ORDER BY ID DESC`;

	let pool = await sql.connect(BSR_CONFIG);
	let response = await pool.request().query(stmt);
	await pool.close();

	// No session found, continue
	if (!response.recordset.length) return next();

	// data found.. assess session time is not more than 1min
	const sessionTimestamp = moment(response.recordset[0].TIMESTAMP).add(
		ALLOCATED_INTERVAL,
		'm'
	);
	const currentTimestamp = moment();

	// if currentTimetstamp is greater, session has expired, clear from db
	if (moment(sessionTimestamp) < moment(currentTimestamp)) {
		Logger(
			`${requestID}|${msisdn}|SessionExpiry|Session has expired|${sessionTimestamp}|${currentTimestamp}`
		);

		stmt = `DELETE FROM [SIMREG_CORE_TBL_AGENT_USSD] WHERE MSISDN='${msisdn}'`;

		pool = await sql.connect(BSR_CONFIG);
		await pool.request().query(stmt);
		await pool.close();
	}

	next();
});

module.exports = SessionExpiry;
