const express = require('express');
const cors = require('cors');
const xmlparser = require('express-xml-bodyparser');
const dotenv = require('dotenv');
const morgan = require('morgan');

const assignID = require('./middleware/assignID');
const errorHandler = require('./middleware/error');
const SessionExpiry = require('./middleware/sessionExpiry');
const devMode = require('./middleware/devMode');
const isAgent = require('./middleware/isAgent');
const clearExpiredSessions = require('./utils/clearExpiredSession');

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
	SessionExpiry,
	require('./routes/routes')
);
app.use(errorHandler);

// Set server port to listen
const PORT = process.env.NODE_PORT;
const MESSAGE = `AGENT-MENU-USSD started in mode: ${process.env.NODE_ENV} on port: ${PORT}`;

app.listen(PORT, () => console.log(MESSAGE));

// set timer to periodically clear old sessions
const timer = parseInt(process.env.CLEAR_EXPIRY_INTERVAL) * 1000;

setInterval(() => {
	clearExpiredSessions();
}, timer);
