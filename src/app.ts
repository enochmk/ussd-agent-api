import express from 'express';
import chalk from 'chalk';
import config from 'config';
import cors from 'cors';
import morgan from 'morgan';
import xmlBodyParser from 'express-xml-bodyparser';
import { createConnection } from 'typeorm';
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

app.listen(port, () => {
	const message = `App is running in mode: ${mode} at http://localhost:${port}`;
	console.log(chalk.bgGreen.bold.black.underline(message));
});

// Connect to the Database and start the application
// createConnection()
// 	.then((_connection) => {
// 		const DB_message = `Connection to database: ${process.env.DB_HOST} has been established`;
// 		console.log(chalk.cyan(DB_message));
// 	})
// 	.catch((err) => {
// 		console.log(chalk.red.italic.underline('DB Error: ' + err.message));
// 		process.exit(1);
// 	});
