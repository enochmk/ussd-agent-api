import axios from 'axios';
import config from 'config';

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
			resolve(response.data);
		} catch (error: any) {
			reject(error.message);
		}
	});
};
