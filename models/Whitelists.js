const { getManager } = require('typeorm');

// ? Query if the MSISDN is in table
exports.get = async (MSISDN) => {
	const entityManager = getManager(); // you can also get it via getConnection().manager
	const stmt = `SELECT MSISDN FROM [BIOSIMREG].[dbo].[SIMREG_CORE_DEVMODE_MSISDN] where MSISDN LIKE '%${MSISDN}%'`;
	const user = await entityManager.query(stmt);

	return user;
};
