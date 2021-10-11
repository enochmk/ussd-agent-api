const axios = require('axios');
const Logger = require('../../utils/Logger');
const formatGhanaCard = require('../../utils/formatGhanaCard');

const action = async (requestID, agentID, answers, cellID) => {
	const data = {
		requestID: requestID,
		cellID: cellID,
		agentID: agentID,
		msisdn: answers[1],
		iccid: answers[2],
		nationalID: formatGhanaCard(answers[3].toUpperCase()),
		forenames: answers[4].toUpperCase(),
		surname: answers[5].toUpperCase(),
		gender: answers[6] == '1' ? 'MALE' : 'FEMALE',
		dateOfBirth: answers[7],
		isMFS: answers[8] == '1' ? true : false,
		nextOfKin: answers[9].toUpperCase() || '',
		channelID: 'ussd',
	};

	Logger(
		`${requestID}|${agentID}|API|nonBioRegistrationAPI|request|${JSON.stringify(
			data
		)}`
	);

	const response = await axios.post(process.env.NON_BIO_REGISTRATION_URL, data);

	Logger(
		`${requestID}|${agentID}|API|nonBioRegistrationAPI|response|${JSON.stringify(
			{ cellID: cellID, response: response.data }
		)}`
	);
};

module.exports = action;
