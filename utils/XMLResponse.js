const sendXMLResponse = (
	sessionID,
	msisdn,
	starcode,
	menu,
	flag,
	timestamp
) => {
	if (msisdn.length === 9) {
		msisdn = `233${msisdn}`;
	}

	return `
		<?xml version="1.0" encoding="utf-8"?>
		<USSDDynMenuResponse>
				<requestId>${sessionID}</requestId>
				<sessionId>${sessionID}</sessionId>
				<msisdn>${msisdn}</msisdn>
				<starCode>${starcode}</starCode>
				<langId>null</langId>
				<encodingScheme>0</encodingScheme>
				<dataSet>
						<param>
								<id>1</id>
								<value>${menu}</value>
								<rspFlag>${flag}</rspFlag>
								<default>1</default>
						</param>
				</dataSet>
				<ErrCode>1</ErrCode>
				<timeStamp>${timestamp}</timeStamp>
		</USSDDynMenuResponse>
	`.trim();
};

module.exports = sendXMLResponse;
// XML Response
