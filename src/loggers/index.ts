import winstonLogger from "./winston";
import safeStringify from "fast-safe-stringify";
import { getLoggerContext } from "./context";

type A = (string | number | Record<string, unknown> | Error)[]

const prepareLogObject = (array: A[]) => {
	const objects = {};
	const arrays: A[] = [];
	const errors: string[] = [];
	array.map((item) => {
		if (item instanceof Error) {
			errors.push(safeStringify(item, Object.getOwnPropertyNames(item) as any));
		} else if (Array.isArray(item)) {
			arrays.push(item);
		} else if (typeof item === "object") {
			Object.assign(objects, item);
		}
	});
	const logString = array.filter((a) => typeof a === "string").join(", ");
	if (arrays.length > 0) {
		Object.assign(objects, { arrays });
	}
	if (errors.length > 0) {
		Object.assign(objects, { errors });
	}
	return {
		objects,
		logString
	};
};

const sendLog = (level: string, ...args: any[]) => {
	const { logString, objects = {} } = prepareLogObject(args);
	Object.assign(objects, { labels: getLoggerContext() });
	if (level === "error") {
		winstonLogger.error(logString, objects);
	} else if (level === "info") {
		winstonLogger.info(logString, objects);
	} else if (level === "debug") {
		winstonLogger.debug(logString, objects);
	} else if (level === "warn") {
		winstonLogger.warn(logString, objects);
	}
};

const error = (...args: any[]) => {
	// console.log(...args);
	sendLog("error", ...args);
};

const info = (...args: any[]) => {
	sendLog("info", ...args);
	// console.log(...args);
};

const debug = (...args: any[]) => {
	// console.debug(args.join(" -> "));
	sendLog("debug", ...args);
};

const warn = (...args: any[]) => {
	sendLog("warn", ...args);
};

const timerify = (...args: (string | number)[]) => {
	const log = args.join(" -> ");
	sendLog("info", log);
};

const startTimer = (message?: string) => {
	const startTime = process.hrtime();
	return {
		startTime,
		message: message || ""
	};
};

const endTimer = (timer: { startTime: [number, number]; message?: string; }) => {
	const endTime = process.hrtime(timer.startTime);
	const ns2ms = 1000000;
	timerify(`[Timer] ${timer.message}`, `took ${endTime[0]}s ${endTime[1] / ns2ms}ms`);
};

type METHODS = "delete" | "get" | "post" | "patch" | "put" 
const logApi = (method: METHODS, ...args: string[]) => {
	// winstonLogger.logApi(`[${method}] ${args.join(" -> ")}`);
};

// class Logger {
// 	private id = "None";
// 	init(id: string) {
// 		this.id = id;
// 	}
// 	error(message: any, err: any) {
// 		error(message, err);
// 	}
// 	info(message: string) {
// 		info(message + " Logged ID: " + this.id);
// 	}
// }

// export default new Logger();
export default {
	error,
	info,
	timerify,
	startTimer,
	endTimer,
	logApi,
	debug,
	warn
};
