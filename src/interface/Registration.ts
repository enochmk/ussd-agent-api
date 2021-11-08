interface Registration {
	requestID: string;
	agentID: string;
	msisdn: string;
	iccid: string;
	nationalID: string;
	forenames: string;
	surname: string;
	gender: string;
	channelID: string;
	dateOfBirth: string;
	cellID: string | null;
	isMFS: boolean;
}

export default Registration;
