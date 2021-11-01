module.exports = {
	type: process.env.DB_CONNECTION,
	host: process.env.DB_HOST,
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	// database: process.env.DB_DATABASE,
	synchronize: false,
	options: {
		debug: true,
		trustedConnection: true,
		encrypt: false,
		enableArithAbort: true,
		trustServerCertificate: true,
	},
	entities: ['entity/**/*.js'],
};
