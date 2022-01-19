interface MFSRegistration {
	requestID: string;
	cellID: string | null;
	agentID: string;
	msisdn: string;
	alternative_number: string;
	nationalID: string;
	forenames: string;
	surname: string;
	gender: string;
	nextOfKin: string;
	channelID: string;
	dateOfBirth: string;
}

export default MFSRegistration;
