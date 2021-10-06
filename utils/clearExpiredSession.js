const moment = require('moment');
const sql = require('mssql');

const Logger = require('../utils/Logger');
const { BSR_CONFIG } = require('../config/database');

const CLEAR_EXPIRY_INTERVAL = process.env.CLEAR_EXPIRY_INTERVAL;
const CLEAR_EXPIRY_VALUE = process.env.CLEAR_EXPIRY_VALUE;
const CLEAR_EXPIRY_UNIT = process.env.CLEAR_EXPIRY_UNIT;

const TABLE_NAME = 'SIMREG_CORE_TBL_AGENT_USSD';

const clearExpiredSession = async () => {
	const timestamp = moment()
		.subtract(CLEAR_EXPIRY_VALUE, CLEAR_EXPIRY_UNIT)
		.format();

	const stmt = `DELETE FROM [dbo].[${TABLE_NAME}] WHERE TIMESTAMP <= '${timestamp}'`;

	const pool = await sql.connect(BSR_CONFIG);
	const response = await pool.request().query(stmt);
	// await pool.close();

	console.log(`Expired Session: ${response.rowsAffected[0]} cleared`);
	Logger(
		`clearExpiredSession|Older than: ${CLEAR_EXPIRY_VALUE} ${CLEAR_EXPIRY_UNIT}|Timer Interval: ${CLEAR_EXPIRY_INTERVAL} seconds|${timestamp}|${response.rowsAffected[0]}|${stmt}`
	);
};

module.exports = clearExpiredSession;
