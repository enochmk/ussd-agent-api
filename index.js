const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const xmlparser = require('express-xml-bodyparser');
const mongoose = require('mongoose');
const chalk = require('chalk');

const assignID = require('./middleware/assignID');
const errorHandler = require('./middleware/error');

const app = express();
dotenv.config();

app.use(cors());
app.use(morgan('tiny'));
app.use(xmlparser());

// app.use('/biometric-agent', assignID, require('./routes/routes'));
app.use(errorHandler);

// Set server port to listen
const PORT = process.env.NODE_PORT || 5000;
const MESSAGE = `AGENT-MENU-USSD started in mode: ${process.env.NODE_ENV} on port: ${PORT}`;

// connect to database
mongoose.connect('mongodb://localhost:27017', () => {
	console.log(chalk.black.bgGreen.bold('Connected to Mongodb'));
	app.listen(PORT, () => console.log(chalk.white.bgYellow.bold(MESSAGE)));
});
