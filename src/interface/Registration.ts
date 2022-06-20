interface Registration {
	requestID: string;
	agentID: string;
	msisdn: string;
	iccid: string;
	docNumber: string;
	forenames: string;
	surname: string;
	gender: string;
	channelID: string;
	dateOfBirth: string;
	alternativeNumber: string;
	cellID: string | null;
	isMFS: boolean;
	nextOfKin: string;
}

export default Registration;
