const moment = require('moment');
const Session = require('../models/Session');
const asyncHandler = require('./async');
// const Logger = require('../utils/Logger');

// grab the allocated time interval in minutes
const ALLOCATED_INTERVAL = process.env.ALLOCATED_INTERVAL;

/**
 * @description Check if a session for this MSISDN has expired
 * @param req.body.msisdn
 */
const SessionExpiry = asyncHandler(async (req, _, next) => {
	if (process.env.PERFORM_SESSION_EXPIRY === 'false') return next();

	const body = req.body.ussddynmenurequest;

	// extract requestID, MSISDN, userData
	const requestID = req.requestID;
	const msisdn = body.msisdn[0].substr(body.msisdn[0].length - 9);

	// get last session
	const lastSession = await Session.findOne({ msisdn: msisdn }).sort({
		_id: 'desc',
	});

	// No session found, continue
	if (!lastSession) return next();

	const currentTimestamp = moment();
	const allocatedTimestamp = moment(lastSession.createdAt).add(
		ALLOCATED_INTERVAL,
		'm'
	);

	// if allocatedTimestamp is greater, session has expired, clear from db
	if (moment(allocatedTimestamp) < moment(currentTimestamp)) {
		await Session.deleteMany({ msisdn: msisdn });
	}

	next();
});

module.exports = SessionExpiry;
