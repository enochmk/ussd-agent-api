const sql = require('mssql');

const asyncHandler = require('./async');
const sendXMLResponse = require('../utils/XMLResponse');
const { BSR_CONFIG } = require('../config/database');
const Logger = require('../utils/Logger');

/**
 * @description MSISDN allowed in devMode
 * @param req.body.msisdn
 * @param req.query.msisdn
 */
const devMode = asyncHandler(async (req, res, next) => {
	// perform DEV_MODE if enable
	if (process.env.DEV_MODE === 'false') return next();

	// get the body request
	const body = req.body.ussddynmenurequest;

	// extract USSD details
	const requestID = req.requestID;
	const msisdn = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];

	Logger(`${requestID}|${msisdn}|devMode|request|${JSON.stringify(body)}`);
	req.channelID = req.body.channelID || req.query.channelID;

	// ? Query if the MSISDN is in table
	// const stmt = `SELECT count(1) AS COUNT FROM [BIOSIMREG].[dbo].[SIMREG_CORE_DEVMODE_MSISDN] where MSISDN LIKE '%${msisdn}%'`;

	// const pool = await sql.connect(BSR_CONFIG);
	// const response = await pool.request().query(stmt);
	// // await pool.close();

	// ! MSISDN not in table
	// if (parseInt(response.recordset[0].COUNT) == 0) {
	// 	const menu = `Dear customer, this application is in developer mode. Kindly check again later`;
	// 	Logger(`${requestID}|${msisdn}|devMode|error|${JSON.stringify(menu)}`);

	// 	console.log(`${msisdn}: devMode|${JSON.stringify(menu)}`);
	// 	return res.send(
	// 		sendXMLResponse(sessionID, msisdn, starcode, menu, 2, timestamp)
	// 	);
	// }

	next();
});

module.exports = devMode;
