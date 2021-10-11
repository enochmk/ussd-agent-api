const axios = require('axios');

const Logger = require('../utils/Logger');

const action = async (requestID, agentID, answers, cellID) => {
	const customerMSISDN = answers[1];

	const URL = `${process.env.GET_SUBSCRIBER_KYC}?agentID=${agentID}&msisdn=${customerMSISDN}&channelID=ussd`;
	const response = await axios.get(URL);

	Logger(
		`${requestID}|${agentID}|API|verifyCustomerDetails|response|${JSON.stringify(
			{
				cellID: cellID,
				response: response.data,
			}
		)}`
	);

	return response.data;
};

module.exports = action;
