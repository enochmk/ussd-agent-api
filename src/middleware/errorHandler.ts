import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';

const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	logger.error('ErrorHandler', { ...err });
	return res.status(500).send('An error occured');
};

export default errorHandler;
