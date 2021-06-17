const axios = require('axios');

const Logger = require('./Logger');

const SMS = async (MSISDN, TEXT, REQUEST_ID = null) => {
	const HOST = `${process.env.SMS_HOST}:${process.env.SMS_PORT}`;
	const USERNAME = process.env.SMS_USERNAME;
	const PASSWORD = process.env.SMS_PASSWORD;

	// invalid MSISDN
	if (!MSISDN || !MSISDN.length) {
		// log to the file
		Logger(
			`${REQUEST_ID}|SMS|error|${MSISDN}|${JSON.stringify(
				TEXT
			)}|Error: Invalid MSISDN`
		);

		return false;
	}

	// take the last 9 characters from the MSISDN
	MSISDN = MSISDN.substr(MSISDN.length - 9);

	const URL = `http://${HOST}/send?username=${USERNAME}&password=${PASSWORD}&to=233${MSISDN}&content=${TEXT}`;

	try {
		const response = await axios.post(URL);

		// log to the file
		Logger(
			`${REQUEST_ID}|SMS|success|${MSISDN}|${JSON.stringify(TEXT)}|${
				response.data
			}`
		);

		return response;
	} catch (error) {
		Logger(
			`${REQUEST_ID}|SMS|error|${MSISDN}|${JSON.stringify(
				TEXT
			)}|${JSON.stringify(error.message)}`
		);

		return error;
	}
};

module.exports = SMS;
