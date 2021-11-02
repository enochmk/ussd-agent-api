interface MenuResponse {
	msisdn: string;
	sessionID: string;
	starcode: string;
	flag: 1 | 2;
	menu: string;
	timestamp: string;
}

export default MenuResponse;
