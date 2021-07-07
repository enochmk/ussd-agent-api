const axios = require('axios');
const Logger = require('../../utils/Logger');

const action = async (agentID, answers, requestID = null) => {
	const data = {
		requestID: requestID,
		agentID: agentID,
		msisdn: answers[1],
		iccid: answers[2],
		nationalID: answers[3].toUpperCase(),
		forenames: answers[4].toUpperCase(),
		surname: answers[5].toUpperCase(),
		gender: answers[6] == '1' ? 'MALE' : 'FEMALE',
		dateOfBirth: answers[7],
		isMFS: answers[8] == '1' ? 1 : 0,
		nextOfKin: answers[9].toUpperCase(),
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
};

module.exports = action;
