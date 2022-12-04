import { createLogger, transports, format } from "winston";
import "winston-daily-rotate-file";
import { LoggingWinston } from "@google-cloud/logging-winston";
import { GCP_PROJECT_ID, GCP_RESOURCE_PREFIX } from "environment";

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
	labels: { pid: process.pid.toString() }
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

const winstonDebugLogger = createLogger({ transports: [ debugTransporter, cloudLogger ] });

const winstonErrorLogger = createLogger({
	transports: [
		errorTransporter,
		cloudLogger
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

const winstonAPILogger = createLogger({
	transports: [
		apiRequestResponseTransporter,
		cloudLogger
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

const winstonInfoLogger = createLogger({
	transports: [
		infoTransporter,
		cloudLogger
		// new transports.File({
		// 	filename: "logs/info.log",
		// 	level: "info",
		// 	format: format.json()
		// }),
	]
});

const winstonTimerLogger = createLogger({
	transports: [
		timerTransporter,
		cloudLogger
		// new transports.File({
		// 	filename: "logs/info.log",
		// 	level: "info",
		// 	format: format.json()
		// }),
	]
});

const error = (error: any) => {
	winstonErrorLogger.error(error);
};

const info = (info: string) => {
	winstonInfoLogger.info(info);
};

const logTime = (info: string) => {
	winstonTimerLogger.info(info);
};

const logApi = (info: string) => {
	winstonAPILogger.info(info);
};

const debug = (debug: string) => {
	winstonDebugLogger.info(debug);
};

export default {
	error,
	info,
	logTime,
	logApi,
	debug
};