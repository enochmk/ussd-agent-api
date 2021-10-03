const uuid = require('uuid').v4;

const assignID = (req, _, next) => {
	req.requestID = req.body.requestID || uuid();
	next();
};

module.exports = assignID;
