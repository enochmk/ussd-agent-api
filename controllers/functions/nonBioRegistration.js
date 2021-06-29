const axios = require('axios');
const Logger = require('../../utils/Logger');

const action = async (agentID, answers, requestID = null) => {
	const data = {
		requestID: requestID,
		agentID: agentID,
		msisdn: answers[0],
		iccid: answers[1],
		nationalID: answers[2].toUpperCase(),
		forenames: answers[3].toUpperCase(),
		surname: answers[4].toUpperCase(),
		gender: answers[5],
		dateOfBirth: answers[6],
		isMFS: answers[7] == '1' ? 1 : 0,
		nextOfKin: answers[8].toUpperCase(),
		channelID: 'ussd',
	};

	Logger(
		`${requestID}|${agentID}|API|nonBioRegistrationAPI|request|${JSON.stringify(
			data
		)}`
	);

	const URL = process.env.NON_BIO_REGISTRATION_URL;
	const response = await axios.post(URL, data);

	Logger(
		`${requestID}|${agentID}|API|nonBioRegistrationAPI|response|${JSON.stringify(
			response.data
		)}`
	);

	return null;
};

module.exports = action;
