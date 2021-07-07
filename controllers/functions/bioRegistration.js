const axios = require('axios');
const Logger = require('../../utils/Logger');

const action = async (agentID, answers, requestID = null) => {
	const data = {
		msisdn: answers[0],
		iccid: answers[1],
		nationalID: answers[2].toUpperCase(),
		suuid: answers[3],
		agentID: agentID,
		channelID: 'ussd',
		confirmed: answers[4],
		isMFS: answers[5] == '1' ? 1 : 0,
		nextOfKin: answers[6].toUpperCase(),
		requestID: requestID,
	};

	Logger(
		`${requestID}|${agentID}|API|bioRegistrationAPI|request|${JSON.stringify(
			data
		)}`
	);

	if (answers[4] !== '1') {
		Logger(
			`${requestID}|${agentID}|API|bioRegistrationAPI|cancelled|You have cancelled the request. Kindly retry to proceed`
		);
		return 'You have cancelled the request. Kindly retry to proceed';
	}

	return null;

	const URL = process.env.REGISTRATION_URL;
	const response = await axios.post(URL, data);
	Logger(
		`${requestID}|${agentID}|API|bioRegistrationAPI|response|${JSON.stringify(
			response.data
		)}`
	);
};

module.exports = action;
