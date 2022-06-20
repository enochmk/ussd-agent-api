import { Request, Response, NextFunction } from 'express';
import { getAgentByMsisdn } from '../models/Agent.model';

import logger from '../utils/logger';
import Messages from '../constant/Messages.json';
import asyncHandler from './asyncHandler';
import sendResponse from '../helper/SendResponse';

/**
 * @description: Check DMS if MSISDN is permitted
 */
const isAgent = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		const body = req.body.ussddynmenurequest;
		let msisdn: string = body.msisdn[0];
		const sessionID = body.requestid[0];
		const starcode = body.starcode[0];
		const timestamp = body.timestamp[0];

		msisdn = msisdn.substr(msisdn.length - 9);
		const found = await getAgentByMsisdn(msisdn);

		if (!found.length) {
			logger.info({
				message: Messages.notAgent,
				label: `isAgentMiddleware`,
				requestID: sessionID,
				agentID: msisdn,
				flag: 2,
			});

			return res.send(
				sendResponse({
					sessionID,
					msisdn,
					starcode,
					menu: Messages.notAgent,
					flag: 2,
					timestamp,
				})
			);
		}

		next();
	}
);

export default isAgent;
