interface MFSRegistration {
	requestID: string;
	cellID: string | null;
	agentID: string;
	msisdn: string;
	nationalID: string;
	forenames: string;
	surname: string;
	gender: string;
	nextOfKin: string;
	channelID: string;
	dateOfBirth: string;
}

export default MFSRegistration;
