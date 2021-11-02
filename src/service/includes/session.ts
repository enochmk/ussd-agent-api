import moment from 'moment';
import { v4 as uuid } from 'uuid';

export const createSession = (
	sessionID: string,
	msisdn: number,
	question: any,
	option: any = null,
	page: any = null,
	userdata: any = null
) => {
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
