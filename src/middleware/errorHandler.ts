import { Request, Response, NextFunction } from 'express';

const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	console.log(err);
	return res.status(500).send('An error occured');
};

export default errorHandler;
