const fs = require('fs');
const path = require('path');
const moment = require('moment');

const FileLogger = (log) => {
	// Get current date
	const filename = moment().format('YYYYMMDD') + '.log';

	// folder directory
	const dir = path.join('logs');

	// Check if folder with current's date exists, else create folder
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	// write to the file path;
	const filePath = path.join(dir, filename);

	// append data to file
	const timestamp = moment().format('YYYY-MM-DD kk:mm:ss');

	// pipe the log to data
	const data = `${timestamp}|${log}\n`;

	try {
		fs.appendFileSync(filePath, data, 'utf8');
	} catch (error) {
		console.log(error);
	}
};

module.exports = FileLogger;
