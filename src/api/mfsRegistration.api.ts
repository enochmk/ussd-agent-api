import axios from 'axios';
import config from 'config';
import logger from '../utils/logger';

import MFSRegistrationInterface from '../interface/MFSRegistration';

const PATH = config.get('api.registrationMFS');
const SERVER = config.get('server');
const URL = `${SERVER}${PATH}`;
const NAMESPACE = 'MFS_REGISTRATION';

export default (
	requestID: string,
	agentID: string,
	data: MFSRegistrationInterface
): Promise<string> => {
	data.msisdn = data.msisdn.substr(data.msisdn.length - 9);
	data.alternativeNumber = data.alternativeNumber.substr(
		data.alternativeNumber.length - 9
	);

	data.alternativeNumber = data.alternativeNumber || ' ';

	return new Promise(async (resolve, reject) => {
		try {
			const response = await axios.post(URL, data);
			logger.http({
				message: response.data,
				label: NAMESPACE,
				url: URL,
				requestID,
				data,
			});

			resolve(response.data.message);
		} catch (error: any) {
			const message = error.response?.data?.message || error.message;

			logger.error({
				message: message,
				stack: error.stack,
				label: NAMESPACE,
				url: URL,
				requestID,
				data,
			});

			reject(message);
		}
	});
};
