const dotenv = require('dotenv');

dotenv.config();

const BSR_CONFIG = {
	server: process.env.BSR_DB_HOST,
	user: process.env.BSR_DB_USER,
	database: process.env.BSR_DB_DATABASE,
	password: process.env.BSR_DB_PASSWORD,
	options: {
		enableArithAbort: true,
		trustedConnection: true,
		encrypt: false,
		enableArithAbort: true,
		trustServerCertificate: true,
	},
	pool: {
		max: 200,
		min: 0,
		idleTimeoutMillis: 30000,
	},
};

const DMS_CONFIG = {
	server: process.env.BSR_DB_HOST,
	user: process.env.BSR_DB_USER,
	database: process.env.BSR_DB_DATABASE,
	password: process.env.BSR_DB_PASSWORD,
	options: {
		enableArithAbort: true,
		trustedConnection: true,
		encrypt: false,
		enableArithAbort: true,
		trustServerCertificate: true,
	},
	pool: {
		max: 200,
		min: 0,
		idleTimeoutMillis: 30000,
	},
};

module.exports = { BSR_CONFIG, DMS_CONFIG };
