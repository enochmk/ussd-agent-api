const axios = require('axios');

const Logger = require('../../utils/Logger');

const action = async (agentID, answers, requestID) => {
	try {
		const customerMSISDN = answers[0];
		Logger(
			`${requestID}|${agentID}|API|verify-customer-details|request|${JSON.stringify(
				customerMSISDN
			)}`
		);

		const URL = `http://10.81.1.124:89/simreg_agent/index.php?agent_msisdn=${agentID}&msisdn=${customerMSISDN}&ops=simReg`;
		const response = await axios.get(URL);

		Logger(
			`${requestID}|${agentID}|API|verify-customer-details|response|${JSON.stringify(
				response.data
			)}`
		);
		return response.data;
	} catch (error) {
		console.log(error);
		Logger(
			`${requestID}|${agentID}|API|verify-customer-details|error|${error.message}`
		);
		return 'An error occured. Please try again later';
	}
};

module.exports = action;
