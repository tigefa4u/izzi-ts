import { createLogger, transports, format } from "winston";
import "winston-daily-rotate-file";

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
	)
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

const winstonDebugLogger = createLogger({ transports: [ debugTransporter ] });

const winstonErrorLogger = createLogger({
	transports: [
		errorTransporter
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
		apiRequestResponseTransporter
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
		infoTransporter
		// new transports.File({
		// 	filename: "logs/info.log",
		// 	level: "info",
		// 	format: format.json()
		// }),
	]
});

const winstonTimerLogger = createLogger({
	transports: [
		timerTransporter
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