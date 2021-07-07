const axios = require('axios');
const Logger = require('../../utils/Logger');

const action = async (agentID, answers, requestID = null) => {
	const data = {
		requestID: requestID,
		agentID: agentID,
		msisdn: answers[1],
		nationalID: answers[2].toUpperCase(),
		forenames: answers[3].toUpperCase(),
		surname: answers[4].toUpperCase(),
		gender: answers[5] == '1' ? 'MALE' : 'FEMALE',
		dateOfBirth: answers[6],
		nextOfKin: answers[7].toUpperCase(),
		channelID: 'ussd',
	};

	Logger(
		`${requestID}|${agentID}|API|nonBioRegistrationMfsAPI|request|${JSON.stringify(
			data
		)}`
	);

	const URL = process.env.NON_BIO_REGISTRATION_MFS_URL;
	const response = await axios.post(URL, data);

	Logger(
		`${requestID}|${agentID}|API|nonBioRegistrationMfsAPI|response|${JSON.stringify(
			response.data
		)}`
	);
};

module.exports = action;
