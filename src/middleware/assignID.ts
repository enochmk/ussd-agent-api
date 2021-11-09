import uuid from 'uuid';
import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';

const assignID = (req: Request, res: Response, next: NextFunction) => {
	req.body.requestID = req.body.sessionId || uuid.v4;
	logger.http('USSDRequest', { url: req.url, body: { ...req.body } });
};

export default assignID;
