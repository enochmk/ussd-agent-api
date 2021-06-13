const moment = require('moment');

const asyncHandler = require('./async');
const sql = require('../database/db');
const Logger = require('../utils/Logger');

// grab the allocated time interval in minutes
const ALLOCATED_INTERVAL = process.env.ALLOCATED_INTERVAL;

const SessionExpiry = asyncHandler(async (req, res, next) => {
  const body = req.body.ussddynmenurequest;

  // extract requestID, MSISDN, userData
  const requestID = body.requestid[0];
  const msisdn = body.msisdn[0];
  req.requestID = requestID;

  // get previous session via MSISDN
  let stmt = null;
  stmt = `SELECT TOP 1 TIMESTAMP FROM [SIMREG_CORE_TBL_AGENT_USSD] WHERE MSISDN='${msisdn}' ORDER BY ID DESC`;

  response = await sql(stmt);

  // No session found, continue
  if (!response.recordset.length) return next();

  // data found.. assess session time is not more than 1min
  const sessionTimestamp = moment(response.recordset[0].TIMESTAMP).add(ALLOCATED_INTERVAL, 'm');
  const currentTimestamp = moment();

  // if currentTimetstamp is greater, session has expired, clear from db
  if (moment(sessionTimestamp) < moment(currentTimestamp)) {
    Logger(`${requestID}|${msisdn}|SessionExpiry|Session has expired|${sessionTimestamp}|${currentTimestamp}`);

    stmt = `DELETE FROM [SIMREG_CORE_TBL_AGENT_USSD] WHERE MSISDN='${msisdn}'`

    await sql(stmt);
  }

  next();
});

module.exports = SessionExpiry;
