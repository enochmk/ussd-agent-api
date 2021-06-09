const sql = require('../database/db');

exports.findOne = async (table, column, value) => {
	const stmt = `SELECT TOP 1 * FROM ${table} WHERE ${column}='${value}'`;

	// execute query
	const results = await sql(stmt);

	// if result is empty return
	if (!results.recordset.length) {
		return [];
	}

	return results.recordset;
};

exports.find = async (table, column, value) => {
	const stmt = `SELECT * FROM ${table} WHERE ${column}=${value}`;

	// execute query
	const results = await sql(stmt);

	console.log(results);

	// if result is empty return
	if (!results.recordsets.length) {
		return [];
	}

	return results.recordsets;
};

exports.insertQuery = async (stmt) => {
	try {
		await sql(stmt);
		return true;
	} catch (error) {
		return false;
	}
};

exports.query = async (stmt) => {
	const results = await sql(stmt);
	return results.recordsets;
};
