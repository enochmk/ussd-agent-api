interface IObjectKeys {
	[key: string]: string | number;
}

interface MenuRequest extends IObjectKeys {
	msisdn: number;
	sessionID: string;
	starcode: string;
	userdata: string;
	timestamp: string;
}

export default MenuRequest;
