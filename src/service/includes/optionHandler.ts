import Messages from '../../constant/Messages.json';
import OptionResponse from '../../interface/OptionResponse';

/**
 * @description A function to redirect selected option to their handler
 */
const optionHandler = (
	option: string,
	sessionID: string,
	msisdn: number,
	client: any
): OptionResponse => {
	let response: OptionResponse;

	// option handler
	switch (option) {
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
