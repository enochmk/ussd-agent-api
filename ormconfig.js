module.exports = {
	type: 'mssql',
	host: '10.81.1.120',
	username: 'dmsuser',
	password: 'Nj8eBCm1sswR9vF6',
	// database: 'BIOSIMREG',
	synchronize: true,
	options: {
		debug: true,
		trustedConnection: true,
		encrypt: false,
		enableArithAbort: true,
		trustServerCertificate: true,
	},
};
