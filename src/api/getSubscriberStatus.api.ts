import axios from 'axios';
import config from 'config';
import logger from '../utils/logger';

const PATH = config.get('api.subscriberStatus');
const SERVER = config.get('server');
const NAMESPACE = 'GET_SUBSCRIBER_STATUS';

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

			logger.info({
				message: response.data,
				label: NAMESPACE,
				url: URL,
				requestID,
			});

			resolve(response.data);
		} catch (error: any) {
			logger.error({
				message: error.message,
				label: NAMESPACE,
				url: URL,
				stack: error.stack,
			});

			reject(error.message);
		}
	});
};
