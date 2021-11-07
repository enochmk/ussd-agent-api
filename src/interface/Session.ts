import { Moment } from 'moment';

interface Session {
	timestamp: Moment;
	id: string;
	sessionID: string;
	msisdn: string;
	question: string | null;
	option: string | null;
	page: string | null;
	userdata: string;
}

export default Session;
