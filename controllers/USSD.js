const moment = require('moment');

const asyncHandler = require('../middleware/async');
const Menu = require('../menu.json');
const sendXMLResponse = require('../utils/XMLResponse');
const Logger = require('../utils/Logger');
const Messages = require('../utils/Messages.json');

/**
 * @description: USSD agent menu for performing non biometric registration/reregistration
 */
const USSD = asyncHandler(async (req, res, _) => {
	const requestID = req.requestID;
	const USSD_CODE = ['*460*46#', '*100*5#'];

	const body = req.body.ussddynmenurequest;
	const agentID = body.msisdn[0].substr(body.msisdn[0].length - 9);
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	const userdata = body.userdata[0].trim();

	// check if subscriber have sessionID

	// if no; start a new session and save to database

	// userdata empty: yes, return same question

	// userdata empty: no, save input on the previous question

	let message = Menu.start;
	let response = sendXMLResponse(
		sessionID,
		agentID,
		starcode,
		message,
		2,
		timestamp
	);

	return res.send(response);
});

module.exports = USSD;
