import MenuResponse from '../interface/MenuResponse';
import logger from '../utils/logger';

/**
 * @description Send Menu Request to 6D
 */
const sendResponse = (data: MenuResponse): string => {
	if (data.msisdn.length === 9) {
		data.msisdn = `233${data.msisdn}`;
	}

	const xmlResponse = `<?xml version="1.0" encoding="utf-8"?><USSDDynMenuResponse><requestId>${data.sessionID}</requestId><sessionId>${data.sessionID}</sessionId><msisdn>${data.msisdn}</msisdn><starCode>${data.starcode}</starCode><langId>null</langId><encodingScheme>0</encodingScheme><dataSet><param><id>1</id><value>${data.menu}</value><rspFlag>${data.flag}</rspFlag><default>1</default></param></dataSet><ErrCode>1</ErrCode><timeStamp>${data.timestamp}</timeStamp></USSDDynMenuResponse>`;

	logger.http('USSDResponse', { data });
	return xmlResponse;
};

export default sendResponse;
