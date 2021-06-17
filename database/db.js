const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const bsr_config = {
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

// run a query against the global connection pool
function runQuery(query, config = bsr_config) {
	return sql
		.connect(config)
		.then((pool) => {
			return pool.query(query);
		})
		.catch((err) => {
			throw err;
		});
}

module.exports = runQuery;
