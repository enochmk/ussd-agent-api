import config from 'config';
import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';
import MenuResponse from '../interface/MenuResponse';
import sendResponse from '../helper/SendResponse';
import Messages from '../constant/Messages.json';

const NODE_ENV = config.get('NODE_ENV');

const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const body = req.body.ussddynmenurequest;
	const msisdn = body.msisdn[0];
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	let userdata = body.userdata[0].trim();

	const message =
		NODE_ENV === 'development' ? err.message : Messages.unknownError;

	logger.error({
		message: err.message,
		agentID: msisdn,
		requestID: sessionID,
		label: 'ERROR_HANDLER',
		// stack: err.stack,
	});

	// forward request to session Manager
	const data: MenuResponse = {
		sessionID,
		msisdn,
		starcode,
		menu: message,
		flag: 2,
		timestamp,
	};

	return res.status(500).send(sendResponse(data));
};

export default errorHandler;
