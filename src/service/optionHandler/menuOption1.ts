import { RedisClient } from 'redis';
import OptionResponse from '../../interface/OptionResponse';

export default async (
	sessionID: string,
	msisdn: string,
	client: RedisClient
): Promise<OptionResponse> => {
	return {
		message: 'Hello from Menu Option 1',
		flag: 2,
	};
};
