const express = require('express');
const cors = require('cors');
const xmlparser = require('express-xml-bodyparser');
const dotenv = require('dotenv').config();
const morgan = require('morgan');

const assignID = require('./middleware/assignID');
const errorHandler = require('./middleware/error');
const SessionExpiry = require('./middleware/sessionExpiry');

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(xmlparser());

app.use(
	'/biometric-agent',
	assignID,
	SessionExpiry,
	require('./routes/biometric-agent')
);

app.use(errorHandler);

// Set server port to listen
const PORT = process.env.NODE_PORT;
const MESSAGE = `AGENT-MENU-USSD started in mode: ${process.env.NODE_ENV} on port: ${PORT}`;

app.listen(PORT, () => console.log(MESSAGE));
