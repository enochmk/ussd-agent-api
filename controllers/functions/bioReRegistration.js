const axios = require('axios');
const Logger = require('../../utils/Logger');
const formatGhanaCard = require('../../utils/formatGhanaCard');

const action = async (agentID, answers, requestID) => {
	const data = {
		requestID: requestID,
		agentID: agentID,
		msisdn: answers[1],
		nationalID: formatGhanaCard(answers[2].toUpperCase()),
		suuid: answers[3].toUpperCase(),
		channelID: 'ussd',
	};

	Logger(
		`${requestID}|${agentID}|API|bioReRegistrationAPI|request|${JSON.stringify(
			data
		)}`
	);

	const URL = process.env.RE_REGISTRATION_URL;
	const response = await axios.post(URL, data);
	Logger(
		`${requestID}|${agentID}|API|bioReRegistrationAPI|response|${JSON.stringify(
			response.data
		)}`
	);
};

module.exports = action;
