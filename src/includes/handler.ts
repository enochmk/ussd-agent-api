import { RedisClient } from 'redis';

import Messages from '../constant/Messages.json';
import OptionResponse from '../interface/OptionResponse';
import option1Handler from './handler/option1.handler';
import option2Handler from './handler/option2.handler';
import option3Handler from './handler/option3.handler';

/**
 * @description A function to redirect selected option to their handler
 */
const optionHandler = async (
	option: string,
	sessionID: string,
	msisdn: string,
	client: RedisClient
): Promise<OptionResponse> => {
	let response: OptionResponse;
	// option handler
	switch (option) {
		case '1':
			response = await option1Handler(sessionID, msisdn, client);
			break;
		case '2':
			response = await option2Handler(sessionID, msisdn, client);
			break;
		case '3':
			response = await option3Handler(sessionID, msisdn, client);
			break;
		default:
			response = {
				message: Messages.invalidOption,
				flag: 2,
			};
			break;
	}

	return response;
};

export default optionHandler;
