const asyncHandler = require('../middleware/async');
const developerOnly = require('../data/DeveloperOnly.json');
const sendXMLResponse = require('../utils/XMLResponse');
const Logger = require('../utils/Logger');

// get the array of supported MSISDNs
const supportedMSISDNs = developerOnly.devMode.whitelist;

const devMode = asyncHandler(async (req, res, next) => {
	// get the body request
	const body = req.body.ussddynmenurequest;

	// extract USSD details
	const requestID = req.requestID;
	const userMsisdn = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];

	// ? is userMsisdn whitelist
	const developer = supportedMSISDNs.find((msisdn) => {
		msisdn = msisdn.substr(msisdn.length - 9);
		return msisdn === userMsisdn;
	});

	const message = !developer
		? developerOnly.devMode.deniedMessage
		: developerOnly.devMode.message;

	// not a developer
	if (!developer) {
		Logger(`${requestID}|${userMsisdn}|devMode|${message}`);

		return res.send(
			sendXMLResponse(sessionID, userMsisdn, starcode, message, 2, timestamp)
		);
	}

	next();
});

module.exports = devMode;
