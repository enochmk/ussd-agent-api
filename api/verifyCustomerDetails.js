const axios = require('axios');

const Logger = require('../utils/Logger');

const action = async (requestID, agentID, answers) => {
	const customerMSISDN = answers[1];

	Logger(
		`${requestID}|${agentID}|API|verifyCustomerDetails|request|${JSON.stringify(
			customerMSISDN
		)}`
	);

	const URL = `${process.env.GET_SUBSCRIBER_KYC}?agentID=${agentID}&msisdn=${customerMSISDN}&channelID=ussd`;
	const response = await axios.get(URL);

	Logger(
		`${requestID}|${agentID}|API|verifyCustomerDetails|response|${JSON.stringify(
			response.data
		)}`
	);

	return response.data;
};

module.exports = action;
