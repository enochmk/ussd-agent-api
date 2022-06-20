import { DataSource } from 'typeorm';

const dataSource = new DataSource({
	type: 'mssql',
	host: process.env.DB_HOST,
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	synchronize: false,
	maxQueryExecutionTime: 60000,
	requestTimeout: 60000,
	options: {
		encrypt: false,
	},
});

export default dataSource;
