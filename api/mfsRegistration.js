const axios = require('axios');
const Logger = require('../../utils/Logger');
const formatGhanaCard = require('../../utils/formatGhanaCard');

const action = async (requestID, agentID, answers, cellID) => {
	const data = {
		requestID: requestID,
		agentID: agentID,
		cellID: cellID,
		msisdn: answers[1],
		nationalID: formatGhanaCard(answers[2].toUpperCase()),
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

	const response = await axios.post(
		process.env.NON_BIO_REGISTRATION_MFS_URL,
		data
	);

	Logger(
		`${requestID}|${agentID}|API|nonBioRegistrationMfsAPI|response|${JSON.stringify(
			{
				cellID: cellID,
				response: response.data,
			}
		)}`
	);
};

module.exports = action;
