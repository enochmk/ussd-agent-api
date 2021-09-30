const axios = require('axios');
const xml2js = require('xml2js');
const dotenv = require('dotenv').config();

const Logger = require('../utils/Logger');

const URL = process.env.INTEGRATION_ENQUIRY_URL;

const CONFIG = {
	headers: {
		'Content-Type': 'text/xml',
		SoapAction: 'IntegrationEnquiry',
	},
};

const IntegrationEnquiry = async (msisdn, requestID = null) => {
	const endpoint = 'IntegrationEnquiryAPI';
	// take the last 9 characters from the MSISDN
	msisdn = msisdn.substr(msisdn.length - 9);

	// check msisdn length is invalid
	if (msisdn.length !== 9) {
		return {
			success: false,
			message: 'Invalid MSISDN. MSISDN must be of 9 digits',
			error: null,
		};
	}

	// SOAP XML BODY
	const soapXMLBody = `
		<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://www.huawei.com/bme/cbsinterface/cbs/businessmgrmsg" xmlns:com="http://www.huawei.com/bme/cbsinterface/common" xmlns:bus1="http://www.huawei.com/bme/cbsinterface/cbs/businessmgr">
		<soapenv:Header/>
		<soapenv:Body>
				<bus:IntegrationEnquiryRequestMsg>
					<RequestHeader>
							<com:CommandId>IntegrationEnquiry</com:CommandId>
							<com:Version>1</com:Version>
							<com:TransactionId></com:TransactionId>
							<com:SequenceId>1</com:SequenceId>
							<com:RequestType>Event</com:RequestType>
							<com:SessionEntity>
								<com:Name>${process.env.INTEGRATION_ENQUIRY_USERNAME}</com:Name>
								<com:Password>${process.env.INTEGRATION_ENQUIRY_PASSWORD}</com:Password>
								<com:RemoteAddress></com:RemoteAddress>
							</com:SessionEntity>
							<com:SerialNo>${requestID}</com:SerialNo>
					</RequestHeader>
					<IntegrationEnquiryRequest>
							<bus1:SubscriberNo>${msisdn}</bus1:SubscriberNo>
							<bus1:QueryType>0</bus1:QueryType>
					</IntegrationEnquiryRequest>
					</bus:IntegrationEnquiryRequestMsg>
			</soapenv:Body>
		</soapenv:Envelope>
	`;

	Logger(
		`${requestID}|${msisdn}|${endpoint}|request|${JSON.stringify(soapXMLBody)}`
	);

	try {
		// Send request
		let XMLResponse = await axios.post(URL, soapXMLBody, CONFIG);

		// convert soap xml -> JSON
		const JSONResponse = await xml2js.parseStringPromise(XMLResponse.data);

		const IntegrationEnquiryResultMsg =
			JSONResponse['soapenv:Envelope']['soapenv:Body'][0][
				'IntegrationEnquiryResultMsg'
			][0];

		// not succesful response
		const successResultCode = '405000000';

		// response code
		const ResultCode =
			IntegrationEnquiryResultMsg['ResultHeader'][0]['ResultCode'][0]['_'];

		// response message
		const ResultDesc =
			IntegrationEnquiryResultMsg['ResultHeader'][0]['ResultDesc'][0]['_'];

		// not a successful repsonse
		if (ResultCode !== successResultCode) {
			// log to file
			Logger(
				`${requestID}|${msisdn}|${endpoint}|error|${ResultCode}|${ResultDesc}`
			);

			return {
				success: false,
				message: ResultDesc,
				lifeCycle: null,
				resultDesc: ResultDesc,
				response: JSONResponse['soapenv:Envelope'],
			};
		}

		// get subscriberState>>lifeCycleState
		const cbsState =
			IntegrationEnquiryResultMsg['IntegrationEnquiryResult'][0][
				'SubscriberState'
			][0]['LifeCycleState'][0];

		// get SubscriberInfo>>Paidmode
		const paidMode =
			IntegrationEnquiryResultMsg['IntegrationEnquiryResult'][0][
				'SubscriberInfo'
			][0]['Subscriber'][0]['PaidMode'][0];

		// Get the activation Year Value
		const activationYear =
			IntegrationEnquiryResultMsg['IntegrationEnquiryResult'][0][
				'SubscriberState'
			][0]['FirstActiveDate'][0];

		Logger(`${requestID}|${msisdn}|${endpoint}|sucess|${paidMode}|${cbsState}`);

		return {
			success: true,
			paidMode,
			activationYear,
			cbsState,
			message: ResultDesc,
			resultDesc: ResultDesc,
			response: JSONResponse['soapenv:Envelope'],
		};
	} catch (error) {
		Logger(
			`${requestID}|${msisdn}|${endpoint}|error|${JSON.stringify(
				error.stack
			)}|${error.message}`
		);

		return {
			success: false,
			message: error.message,
			error,
		};
	}
};

module.exports = IntegrationEnquiry;
