import 'reflect-metadata';
import express from 'express';
import chalk from 'chalk';
import config from 'config';
import cors from 'cors';
import morgan from 'morgan';
import xmlBodyParser from 'express-xml-bodyparser';
import { createConnection, ConnectionOptions } from 'typeorm';

import logger from './utils/logger';
import ussd from './routes/ussd.routes';
import errorHandler from './middleware/errorHandler';

const app = express();
const port = config.get<number>('port');
const mode = config.get<string>('environment');

app.use(cors());
app.use(morgan('tiny'));
app.use(xmlBodyParser());
app.use('/', ussd);
app.use(errorHandler);

// Connect to the Database and start the application
createConnection()
	.then((_connection: any) => {
		const DB_message = `Connection to database: ${_connection.options.host}/${_connection.options.database} has been established`;
		logger.info(chalk.bgGreen.bold.black.underline(DB_message));

		// start Express Server
		app.listen(port, () => {
			const message = `App is running in mode: ${mode} at http://localhost:${port}`;
			logger.info(chalk.bgGreen.bold.black.underline(message));
		});
	})
	.catch((err) => {
		logger.error(chalk.red.italic('Unable to connect to database'));
		logger.error(chalk.red.italic(err.message));
		process.exit(1);
	});
