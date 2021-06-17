const uuid = require('uuid').v4;

const assignID = (req, res, next) => {
	req.requestID = req.body.requestID || uuid();
	next();
};

module.exports = assignID;
