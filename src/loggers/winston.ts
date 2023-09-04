import { createLogger, transports, format } from "winston";
import "winston-daily-rotate-file";
import { LoggingWinston } from "@google-cloud/logging-winston";
import { GCP_LOGGING_CLIENT_EMAIL, GCP_LOGGING_PRIVATE_KEY, GCP_PROJECT_ID, GCP_RESOURCE_PREFIX } from "environment";

const cloudLogger = new LoggingWinston({
	projectId: GCP_PROJECT_ID,
	keyFilename: "izzi-cloud-logging.json",
	prefix: GCP_RESOURCE_PREFIX,
	defaultCallback: (err, resp) => {
		console.log({
			err,
			resp 
		});
	},
	resource: { type: "service_account" },
	// credentials: {
	// 	client_email: GCP_LOGGING_CLIENT_EMAIL,
	// 	private_key: GCP_LOGGING_PRIVATE_KEY,
	// },
	// labels: { pid: process.pid.toString() }
});

const infoTransporter = new transports.DailyRotateFile({
	filename: "logs/info-%DATE%.log",
	datePattern: "YYYY-MM-DD-HH",
	zippedArchive: true,
	maxSize: "5g",
	maxFiles: "14d",
	format: format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		format.json()
	),
});

const debugTransporter = new transports.DailyRotateFile({
	filename: "logs/debug-%DATE%.log",
	datePattern: "YYYY-MM-DD-HH",
	zippedArchive: true,
	maxSize: "10g",
	maxFiles: "7d",
	format: format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		format.json()
	)
});

const errorTransporter = new transports.DailyRotateFile({
	filename: "logs/error-%DATE%.log",
	datePattern: "YYYY-MM-DD-HH",
	zippedArchive: true,
	maxSize: "5g",
	maxFiles: "14d",
	format: format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		format.json()
	)
});

const timerTransporter = new transports.DailyRotateFile({
	filename: "logs/exectime-%DATE%.log",
	datePattern: "YYYY-MM-DD-HH",
	zippedArchive: true,
	maxSize: "1g",
	maxFiles: "14d",
	format: format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		format.json()
	)
});

const apiRequestResponseTransporter = new transports.DailyRotateFile({
	filename: "logs/api-requestresponse-%DATE%.log",
	datePattern: "YYYY-MM-DD-HH",
	zippedArchive: true,
	maxSize: "1g",
	maxFiles: "14d",
	format: format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		format.json()
	)
});

const winstonAPILogger = createLogger({
	transports: [
		// apiRequestResponseTransporter,
		// cloudLogger
		// new transports.File({
		// 	filename: "logs/error.log",
		// 	level: "error",
		// 	format: format.combine(
		// 		format.errors({ stack: true }),
		// 		format.timestamp(),
		// 		format.json()
		// 	),
		// }),
		// new transports.File({
		// 	filename: "logs/info.log",
		// 	level: "info",
		// 	format: format.json()
		// }),
		// new transports.File({
		// 	filename: "logs/warn.log",
		// 	level: "warn",
		// 	format: format.json(),
		// })
	],
});

const logger = createLogger({
	format: format.combine(format.timestamp(), format.json()),
	transports: [
		// new transports.Console(),
		cloudLogger
		// infoTransporter,
		// new transports.File({
		// 	filename: "logs/info.log",
		// 	level: "info",
		// 	format: format.json()
		// }),
	]
});

export default logger;