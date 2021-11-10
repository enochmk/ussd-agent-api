import moment from 'moment';
import { v4 as uuid } from 'uuid';

import Session from '../interface/Session';

export const createSession = (
	sessionID: string,
	msisdn: string,
	question: string | null,
	option: string | null = null,
	page: string | null = null,
	userdata: any = null
): Session => {
	return {
		timestamp: moment(Date.now()),
		id: uuid(),
		sessionID,
		msisdn,
		question,
		option,
		page,
		userdata,
	};
};
