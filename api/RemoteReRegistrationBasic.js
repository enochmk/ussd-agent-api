const axios = require('axios');

const Logger = require('../utils/Logger');
const SMS = require('../utils/SMS');

// call the re-registration API
const RemoteReRegistrationBasic = async (data, requestID) => {
	Logger(`${requestID}|BasicAPI|request|${data}`);

	try {
		const response = await axios.post(
			process.env.REMOTE_RE_REGISTRATION_BASIC_URL,
			data
		);

		Logger(
			`${requestID}|BasicAPI|success|${JSON.stringify(
				data
			)}`
		);

		SMS(data.msisdn, response.data, requestID);

		return {
			success: true,
			message: response.data,
			data: response.data,
		};
	} catch (error) {
		let message = '';

		// Server unreachable
		if (error.code == 'ECONNREFUSED') {
			message = `Remote BIO Server running on server: ${error.address}:${error.port} is unreachable`;

			Logger(
				`${requestID}|BasicAPI|error|${error.code}|${message}|${JSON.stringify(error.response)}`
			);

			return {
				success: false,
				message: message,
			};
		}

		Logger(
			`${requestID}|BasicAPI|error|${JSON.stringify(
				error.response.data.message
			)}`
		);

		SMS(data.msisdn, error.response.data.data, requestID);

		return {
			success: false,
			message: error.response.data.message,
			statusCode: error.response.status,
		};
	}
};

module.exports = RemoteReRegistrationBasic;
