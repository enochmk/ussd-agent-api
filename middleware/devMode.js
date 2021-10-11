const Whitelists = require('../models/Whitelists');
const asyncHandler = require('./async');
const Messages = require('../utils/Messages');
const Logger = require('../utils/Logger');
const sendXMLResponse = require('../utils/XMLResponse');

/**
 * @description MSISDN allowed in devMode
 * @param req.body.msisdn
 * @param req.query.msisdn
 */
const devMode = asyncHandler(async (req, res, next) => {
	// perform DEV_MODE if enable
	if (process.env.DEV_MODE === 'false') return next();

	// extract USSD details
	const body = req.body.ussddynmenurequest;
	const requestID = req.requestID;
	const msisdn = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];

	req.channelID = req.body.channelID || req.query.channelID;

	// ? Query if the MSISDN is in table
	const user = await Whitelists.get(msisdn);

	// ! MSISDN not in table
	if (!user.length) {
		Logger(
			`${requestID}|${msisdn}|devMode|error|${JSON.stringify(Messages.devOnly)}`
		);

		console.log(`${msisdn}: devMode|${JSON.stringify(Messages.devOnly)}`);
		return res.send(
			sendXMLResponse(
				sessionID,
				msisdn,
				starcode,
				Messages.devOnly,
				2,
				timestamp
			)
		);
	}

	next();
});

module.exports = devMode;
