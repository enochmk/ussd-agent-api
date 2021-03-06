import axios from 'axios';
import config from 'config';
import logger from '../utils/logger';

import RegistrationInterface from '../interface/Registration';

const PATH = config.get('api.registration');
const SERVER = config.get('server');
const URL = `${SERVER}${PATH}`;
const NAMESPACE = 'REGISTRATION';

export default (
	requestID: string,
	agentID: string,
	data: RegistrationInterface
): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		data.alternativeNumber = data.alternativeNumber.substr(
			data.alternativeNumber.length - 9
		);

		data.alternativeNumber = data.alternativeNumber || ' ';
		data.msisdn = data.msisdn.substr(data.msisdn.length - 9);

		try {
			const response = await axios.post(URL, data);

			logger.info({
				message: response.data,
				label: NAMESPACE,
				url: URL,
				requestID,
				request: data,
			});

			resolve(response.data.message);
		} catch (error: any) {
			const message = error.response?.data?.message || error.message;

			logger.error({
				message: message,
				label: NAMESPACE,
				url: URL,
				requestID,
				stack: error.stack,
				request: data,
			});

			reject(message);
		}
	});
};
