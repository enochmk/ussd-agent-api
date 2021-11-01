import uuid from 'uuid';
import { Request, Response, NextFunction } from 'express';

const assignID = (req: Request, res: Response, next: NextFunction) => {
	req.body.sessionId = req.body.sessionId || uuid.v4;
};

export default assignID;
