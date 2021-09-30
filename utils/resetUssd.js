const sql = require('mssql');
const { BSR_CONFIG } = require('../config/database');

const resetUssd = async (tableName) => {
	const stmt = `DELETE FROM ${tableName}`;
	const pool = await sql.connect(BSR_CONFIG);
	await pool.request().query(stmt);
	await pool.close();
};

module.exports = resetUssd;
