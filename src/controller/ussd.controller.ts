import { Request, Response, NextFunction } from 'express';
import SessionManager from '../service/SessionManager';
import MenuRequest from '../interface/MenuRequest';

const ussd = (req: Request, res: Response, next: NextFunction) => {
	const body = req.body.ussddynmenurequest;
	const msisdn = body.msisdn[0];
	const sessionID = body.requestid[0];
	const starcode = body.starcode[0];
	const timestamp = body.timestamp[0];
	let userdata = body.userdata[0].trim();

	// forward request to session Manager
	const data: MenuRequest = {
		msisdn,
		sessionID,
		starcode,
		timestamp,
		userdata,
	};

	res.send(SessionManager(data));
};

export default ussd;
