const sql = require('mssql');

const asyncHandler = require('./async');
const sendXMLResponse = require('../utils/XMLResponse');
const { DMS_CONFIG } = require('../config/database');
const Messages = require('../data/Messages.json');

/**
 * @description MSISDN already Registered
 * @param req.body.msisdn
 * @param req.query.msisdn
 */

const isAgent = asyncHandler(async (req, res, next) => {
	// get the body request
	const body = req.body.ussddynmenurequest;

	// extract USSD details
	const requestID = req.requestID;
	const msisdn = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];

	req.channelID = req.body.channelID || req.query.channelID;

	// Check if PERFORM_IS_REGISTERED is enabled
	if (process.env.PERFORM_IS_AGENT === 'false') return next();

	// ? Check if MSISDN already registered
	const stmt = `SELECT ACTIVATORID, ACTIVATORMSISDN FROM [dms2].[dbo].[DMS_JOB_SIMREG_TBL_ENGRAFI_AUTHENTICATION] WHERE ACTIVATORID = '${msisdn}' OR ACTIVATORMSISDN = '${msisdn}'`;
	const pool = await sql.connect(DMS_CONFIG);
	let response = await pool.request().query(stmt);
	// await pool.close();

	// ! MSISDN already registered
	if (!response.recordset.length) {
		const message = Messages.notAgent;

		response = sendXMLResponse(
			sessionID,
			msisdn,
			starcode,
			message,
			2,
			timestamp
		);

		return res.send(response);
	}

	next();
});

module.exports = isAgent;
