import { Request, Response, NextFunction } from 'express';
import SessionManager from '../service/SessionManager';
import MenuRequest from '../interface/MenuRequest';
import asyncHandler from '../middleware/asyncHandler';
import logger from '../utils/logger';

const ussd = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		logger.info({
			message: 'ussdynmeurequest',
			label: `request`,
			requestID: Date.now().toString(),
			agentID: '',
			request: req.body.ussddynmenurequest,
		});

		const body: any = req.body.ussddynmenurequest;
		const msisdn: string = body.msisdn[0];
		const sessionID: string = body.requestid[0];
		const starcode: string = body.starcode[0];
		const timestamp: string = body.timestamp[0];
		const cellID: string = body.dataset[0]['param'][1]['value'][0];
		let userdata: string = body.userdata[0].trim();

		// forward request to session Manager
		const data: MenuRequest = {
			msisdn: msisdn.substr(msisdn.length - 9),
			sessionID,
			starcode,
			timestamp,
			userdata,
			cellID,
		};

		const response = await SessionManager(data);
		res.send(response);
	}
);

export default ussd;
