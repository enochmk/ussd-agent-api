const uuid = require('uuid').v4;

const asyncHandler = require('../../middleware/async');
const BioAgentMenu = require('../../data/BioAgentMenu.json');
const sendXMLResponse = require('../../utils/XMLResponse');
const sql = require('../../database/db');

// the initial code to begin session
const USSD_CODE = `${process.env.USSD_CODE}` || '460*49';

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

const BioAgentUSSD = asyncHandler(async (req, res, next) => {
	const body = req.body.ussddynmenurequest;

	// extract requestID, MSISDN, userData
	const requestID = body.requestid[0];
	const msisdn = body.msisdn[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	const userdata = body.userdata[0];

	return res.send(
		sendXMLResponse(
			requestID,
			msisdn,
			starcode,
			BioAgentMenu.basic.welcome,
			2,
			timestamp
		)
	);
});

module.exports = BioAgentUSSD;
