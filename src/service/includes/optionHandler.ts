import { RedisClient } from 'redis';

import Messages from '../../constant/Messages.json';
import OptionResponse from '../../interface/OptionResponse';
import menuOption1 from '../optionHandler/menuOption1';
import menuOption2 from '../optionHandler/menuOption2';
import menuOption3 from '../optionHandler/menuOption3';

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
			response = await menuOption1(sessionID, msisdn, client);
			break;
		case '2':
			response = await menuOption2(sessionID, msisdn, client);
			break;
		case '3':
			response = await menuOption3(sessionID, msisdn, client);
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
