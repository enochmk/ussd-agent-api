import axios from 'axios';
import config from 'config';
import logger from '../utils/logger';

import RegistrationInterface from '../interface/Registration';

const PATH = config.get('api.registrationMFS');
const SERVER = config.get('server');
const URL = `${SERVER}${PATH}`;

export default (
	requestID: string,
	agentID: string,
	data: RegistrationInterface
): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		try {
			const response = await axios.post(URL, data);

			logger.http({
				message: response.data,
				label: 'REGISTRATION',
				url: URL,
				requestID,
				data,
			});

			resolve(response.data);
		} catch (error: any) {
			logger.error({
				message: error.message,
				label: 'REGISTRATION',
				url: URL,
				requestID,
				stack: error.stack,
				data,
			});
			reject(error.message);
		}
	});
};
