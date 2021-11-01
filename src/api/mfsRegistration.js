const axios = require('axios');
const util = require('util');

const Logger = require('../utils/Logger');

const action = async (requestID, agentID, answers, cellID = null) => {
	const data = {
		requestID: requestID,
		cellID: cellID,
		agentID: agentID,
		msisdn: answers.MSISDN,
		nationalID: answers.ID,
		forenames: answers.FORENAMES,
		surname: answers.SURNAME,
		gender: answers.SEX,
		dateOfBirth: answers.DOB,
		nextOfKin: answers.NOK.toUpperCase(),
		channelID: 'ussd',
	};

	try {
		const response = await axios.post(
			process.env.RE_REGISTRATION_MFS_URL,
			data
		);

		Logger(
			`${requestID}|${agentID}|API|nonBioRegistrationMFSAPI|response|${JSON.stringify(
				{ request: data, response: response.data }
			)}`
		);
	} catch (error) {
		Logger(
			`${requestID}|${agentID}|API|nonBioRegistrationMFSAPI|error|${JSON.stringify(
				{
					request: data,
					error: error.response ? error.response.data : error.message,
					message: error.message,
					stack: util.inspect(error.stack),
				}
			)}`
		);
	}
};

module.exports = action;
