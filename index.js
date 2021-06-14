const express = require('express');
const cors = require('cors');
const xmlparser = require('express-xml-bodyparser');
const dotenv = require('dotenv').config();
const morgan = require('morgan');

const errorHandler = require('./middleware/error');

const app = express();

app.use(cors());
app.use(morgan('tiny'));
app.use(xmlparser());

app.use('/biometric-agent', require('./routes/biometric-agent'));
app.use(errorHandler);

// Set server port to listen
const PORT = process.env.NODE_PORT;

const MESSAGE = `BIOMETRIC AGENT USSD API started in ${process.env.NODE_ENV} on port: ${PORT}`;

app.listen(PORT, () => console.log(MESSAGE));
