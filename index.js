const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createConnection } = require('typeorm');
const morgan = require('morgan');
const xmlparser = require('express-xml-bodyparser');
const mongoose = require('mongoose');
const chalk = require('chalk');

const assignID = require('./middleware/assignID');
const devMode = require('./middleware/devMode');
const isAgent = require('./middleware/isAgent');
const sessionExpiry = require('./middleware/sessionExpiry');
const errorHandler = require('./middleware/error');

const app = express();
dotenv.config();

app.use(cors());
app.use(morgan('tiny'));
app.use(xmlparser());

app.use(
	'/biometric-agent',
	assignID,
	devMode,
	isAgent,
	sessionExpiry,
	require('./routes/routes')
);
app.use(errorHandler);

const PORT = process.env.NODE_PORT || 5000;
const MESSAGE = `AGENT-MENU-USSD started in mode: ${process.env.NODE_ENV} on port: ${PORT}`;
const server = app.listen(PORT, () =>
	console.log(chalk.white.bgYellow.bold(MESSAGE))
);

// Set server port to listen
const mongoURI = 'mongodb://localhost:27017/ussd-agent';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (error) => {
	console.log('mongoose error:', error);
	server.close(1);
});

db.once('open', () => {
	console.log(chalk.black.bgGreen.bold('Connected to Mongodb'));
});

createConnection()
	.then((connection) => {
		console.log(chalk.black.bgGreen.bold('Connected to SQL database'));
	})
	.catch((error) => {
		console.log('SQL Error: ', error);
		server.close(1);
	});
