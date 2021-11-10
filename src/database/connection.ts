import { Sequelize } from 'sequelize';
import config from 'config';

const { name, username, password, host, dialect }: any = config.get('database');
const sequelize = new Sequelize(name, username, password, {
	host: host,
	dialect: dialect,
	logging: false,
	dialectOptions: {
		encrypt: false,
		trustedConnection: true,
		enableArithAbort: true,
		trustServerCertificate: true,
	},
});

export default sequelize;
