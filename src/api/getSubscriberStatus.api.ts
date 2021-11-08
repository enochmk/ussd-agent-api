import axios from 'axios';
import config from 'config';

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
			resolve(response.data);
		} catch (error: any) {
			reject(error.message);
		}
	});
};
