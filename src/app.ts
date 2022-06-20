import express from 'express';
import config from 'config';
import cors from 'cors';
import morgan from 'morgan';
import xmlBodyParser from 'express-xml-bodyparser';

import logger from './utils/logger';
import ussd from './routes/ussd.routes';
import errorHandler from './middleware/errorHandler';
import DmsDatabase from './database/DMS.database';

const app = express();

const port = config.get('port') as number;
const mode = config.get('environment') as string;

app.use(cors());
app.use(morgan('tiny'));
app.use(xmlBodyParser());
app.use('/', ussd);
app.use(errorHandler);

// start Express Server
app.listen(port, async () => {
	await DmsDatabase.initialize();

	logger.info('Connected to BI Database');
	const message = `App is running in mode: ${mode} at http://localhost:${port}`;
	logger.verbose(message);
});
