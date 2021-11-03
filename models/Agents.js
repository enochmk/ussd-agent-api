const { getManager } = require('typeorm');

// ? Query if the MSISDN is in table
exports.get = async (MSISDN) => {
	const entityManager = getManager(); // you can also get it via getConnection().manager
	const stmt = `SELECT ACTIVATORMSISDN FROM [dms2].[dbo].[DMS_JOB_SIMREG_TBL_ENGRAFI_AUTHENTICATION] WITH (NOLOCK)
  WHERE ACTIVATORMSISDN = '${MSISDN}'`;
	const user = await entityManager.query(stmt);

	return user;
};
