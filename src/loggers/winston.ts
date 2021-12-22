import { createLogger, transports, format } from "winston";
// require("winston-daily-rotate-file");

// let transport = new transports.DailyRotateFile({
//   filename: "logs/error-%DATE%.log",
//   datePattern: "YYYY-MM-DD-HH",
//   zippedArchive: true,
//   maxSize: "20m",
//   maxFiles: "14d",
// });

const winstonErrorLogger = createLogger({
	transports: [
		// transport
		new transports.File({
			filename: "logs/error.log",
			level: "error",
			format: format.combine(
				format.errors({ stack: true }),
				format.timestamp(),
				format.json()
			),
		}),
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
		new transports.File({
			filename: "logs/info.log",
			level: "info",
			format: format.json()
		}),
	]
});

const error = (error: any) => {
	winstonErrorLogger.error(error);
};

const info = (info: string) => {
	winstonInfoLogger.info(info);
};

export default {
	error,
	info 
};