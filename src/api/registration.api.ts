const axios = require('axios');

const action = async (requestID, agentID, answers, cellID = null) => {
	const data = {
		requestID: requestID,
		cellID: cellID,
		agentID: agentID,
		msisdn: answers.MSISDN,
		iccid: answers.ICCID,
		nationalID: answers.ID,
		forenames: answers.FORENAMES,
		surname: answers.SURNAME,
		gender: answers.SEX,
		dateOfBirth: answers.DOB,
		isMFS: answers.ATM.toLowerCase() === 'yes' ? true : false,
		nextOfKin: answers.ATM.toLowerCase() === 'yes' ? answers.NOK : '',
		channelID: 'ussd',
	};

	try {
		const response = await axios.post(process.env.RE_REGISTRATION_URL, data);
	} catch (error) {}
};

module.exports = action;
