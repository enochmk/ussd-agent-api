const axios = require('axios');

const Logger = require('../utils/Logger');
const SMS = require('../utils/SMS');

// call the re-registration API
const ReRegistrationSecurity = async (data, requestID) => {
	Logger(`${requestID}|SecurityAPI|request|${data}`);

	try {
		const response = await axios.post(
			process.env.REMOTE_RE_REGISTRATION_SECURITY_URL,
			data
		);

		Logger(
			`${requestID}|SecurityAPI|success|${JSON.stringify(
				response.data
			)}`
		);

		SMS(data.msisdn, response.data, requestID);

		return {
			success: true,
			message: response.data,
			data: response.data,
		};
	} catch (error) {
		console.error(error);

		let message = '';

		// Server unreachable
		if (error.code == 'ECONNREFUSED') {
			message = `Remote BIO Server running on server: ${error.address}:${error.port} is unreachable`;

			Logger(
				`${requestID}|SecurityAPI|error|${error.code}|${message}|${JSON.stringify(error)}`
			);

			return {
				success: false,
				message: message,
				statusCode: error.response.status,
			};
		}

		Logger(
			`${requestID}|SecurityAPI|error|${JSON.stringify(
				error.response.data.message
			)}`
		);

		SMS(data.msisdn, error.response.data.message, requestID);

		return {
			success: false,
			message: error.response.data.message,
			statusCode: error.response.status,
		};
	}
};

module.exports = ReRegistrationSecurity;
