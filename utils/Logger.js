const fs = require('fs');
const os = require('os');
const path = require('path');
const moment = require('moment');

const FileLogger = (log) => {
	let location = 'logs';

	if (os.platform() === 'win32') {
		location = process.env.LOG_PATH_WINDOWS;
	} else if (os.platform() === 'linux') {
		location = process.env.LOG_PATH_LINUX;
	}

	// folder directory
	const dir = path.join(location);

	// Check if folder with current's date exists, else create folder
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	// Get current date
	const filename = moment().format('YYYYMMDD') + '.log';
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
