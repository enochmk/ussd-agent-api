import axios from 'axios';
import config from 'config';
import logger from '../utils/logger';

const PATH = config.get('api.subscriberStatus');
const SERVER = config.get('server');

export default (
	requestID: string,
	agentID: string,
	msisdn: string,
	cellID: string | null = null
): Promise<string> => {
	const URL = `${SERVER}${PATH}?agentID=${agentID}&msisdn=${msisdn}&channelID=ussd&cellID=${cellID}`;

	return new Promise(async (resolve, reject) => {
		try {
			const response = await axios.get(URL);

			logger.http({
				message: response.data,
				label: 'GET_SUBSCRIBER_STATUS',
				url: URL,
				requestID,
			});

			resolve(response.data);
		} catch (error: any) {
			logger.error({
				message: error.message,
				label: 'GET_SUBSCRIBER_STATUS',
				url: URL,
				stack: error.stack,
			});

			reject(error.message);
		}
	});
};
