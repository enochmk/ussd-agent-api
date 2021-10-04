const axios = require('axios');

const Logger = require('../utils/Logger');

const action = async (agentID, answers, requestID) => {
	try {
		const customerMSISDN = answers[1];

		Logger(
			`${requestID}|${agentID}|API|verify-customer-details|request|${JSON.stringify(
				customerMSISDN
			)}`
		);

		const URL = `${process.env.GET_SUBSCRIBER_KYC}?agentID=${agentID}&msisdn=${customerMSISDN}&channelID=ussd`;
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

		return 'Something went wrong. Please try again later';
	}
};

module.exports = action;