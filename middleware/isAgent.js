const Agents = require('../models/Agents');
const asyncHandler = require('./async');
const sendXMLResponse = require('../utils/XMLResponse');
const Messages = require('../utils/Messages.json');

/**
 * @description check if MSISDN is in table
 * @param req.body.msisdn
 */
const isAgent = asyncHandler(async (req, res, next) => {
	const requestID = req.requestID;
	req.channelID = 'ussd';

	// extract USSD details
	const body = req.body.ussddynmenurequest;
	const msisdn = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];

	// Check if PERFORM_IS_AGENT is enabled
	if (process.env.PERFORM_IS_AGENT === 'false') return next();

	// ? Check if MSISDN is in table
	const agent = await Agents.get(msisdn);

	// ! Not permitted to use this channel
	if (!agent.length) {
		return res.send(
			sendXMLResponse(
				sessionID,
				msisdn,
				starcode,
				Messages.notAgent,
				2,
				timestamp
			)
		);
	}

	next();
});

module.exports = isAgent;
