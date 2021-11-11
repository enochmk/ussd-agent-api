interface IObjectKeys {
	[key: string]: string | number;
}

interface MenuRequest extends IObjectKeys {
	msisdn: number;
	sessionID: string;
	starcode: string;
	userdata: string;
	timestamp: string;
	cellID?: any;
}

export default MenuRequest;
