import { DataTypes } from 'sequelize';
import sequelize from '../database/connection';

const Ussd = sequelize.define(
	'SIMREG_CORE_TBL_USSD_AGENTS',
	{
		ID: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			allowNull: false,
			primaryKey: true,
		},
		SESSION_ID: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		AGENT_ID: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		MSISDN: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		OPTION: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		FORENAMES: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		SURNAME: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		PIN_NUMBER: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		DOB: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		GENDER: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		NEXTOFKIN: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		CELLID: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		TIMESTAMP: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'SIMREG_CORE_TBL_USSD_AGENTS',
		timestamps: false,
	}
);

(async () => {
	await sequelize.sync({ force: true });
	// Code here
})();

export default Ussd;
