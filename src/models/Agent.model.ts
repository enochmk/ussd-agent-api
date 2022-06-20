import DmsDB from '../database/DMS.database';

export const getAgentByMsisdn = async (msisdn: string) => {
	const stmt = `SELECT TOP 1 ACTIVATORMSISDN FROM [dms2].[dbo].[DMS_JOB_SIMREG_TBL_ENGRAFI_AUTHENTICATION] WITH (NOLOCK) WHERE ACTIVATORMSISDN = '${msisdn}'`;

	const record = await DmsDB.query(stmt);
	return record;
};
