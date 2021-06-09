const logger = require('../utils/Logger');

const errorHandler = (err, req, res, next) => {
	// display error only in development
	if (process.env.NODE_ENV === 'development') {
		console.log(`${err}`);
	} else {
		console.log(err.message);
	}

	let message = 'Server Error. Please contact admin';
	let error = { ...err };
	error.message = err.message;
	const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

	// log to the file
	logger(
		`${req.requestID}|errorhandler|${fullUrl}|${JSON.stringify(req.body)}|${
			error.statusCode || 500
		}|${error.message || 'Serverside Error. Please contact admin'}`
	);

	// Return error response
	if (req.channelID == 'web') {
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Serverside Error. Please contact admin',
		});
	} else {
		res.send(error.message || 'Serverside Error. Please contact admin');
	}
};

module.exports = errorHandler;
