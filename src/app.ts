import express from 'express';
import chalk from 'chalk';
import config from 'config';
import cors from 'cors';
import morgan from 'morgan';
import xmlBodyParser from 'express-xml-bodyparser';
import sequelize from './database/connection';

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

// start Express Server
app.listen(port, () => {
	const message = `App is running in mode: ${mode} at http://localhost:${port}`;
	logger.info(chalk.bgGreen.bold.black.underline(message));
});

// connect to database
sequelize
	.authenticate()
	.then(() => {
		logger.info('Database connection established successfully.');
	})
	.catch((error) => {
		console.error('Database error', error);
		process.exit(1);
	});

// sequelize
// 	.sync({ force: true })
// 	.then((data) => {
// 		console.log('Synced');
// 	})
// 	.catch((error) => console.log(error));
