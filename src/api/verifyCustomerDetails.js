const axios = require('axios');
const util = require('util');

const Logger = require('../utils/Logger');

const action = async (requestID, agentID, msisdn, cellID = null) => {
	const URL = `${process.env.GET_SUBSCRIBER_KYC}?agentID=${agentID}&msisdn=${msisdn}&channelID=ussd&cellID=${cellID}`;

	try {
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
	} catch (error) {
		Logger(
			`${requestID}|${agentID}|API|verifyCustomerDetails|error|${JSON.stringify(
				{
					stack: error.stack,
					response: util.inspect(error.response),
					message: error.message,
				}
			)}`
		);
	}
};

module.exports = action;
