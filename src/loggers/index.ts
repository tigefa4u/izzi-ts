import winstonLogger from "./winston";

const error = (errMessage: string, err: unknown) => {
	let errorMessage: string | undefined = "Unknown Error";
	if (err instanceof Error) {
		errorMessage = err.stack;
	}
	// console.error(errMessage, errorMessage);
	winstonLogger.error(errMessage + JSON.stringify(errorMessage));
};

const info = (infoMessage: string) => {
	// console.info(infoMessage, "pid: ", getLoggerContext());
	winstonLogger.info(infoMessage);
};

const debug = (...args: any[]) => {
	// console.log(args.join(", "));
	// winstonLogger.debug(args.map((value) => typeof value !== "string" ? JSON.stringify(value) : value).join(", "));
};

const timerify = (...args: (string | number)[]) => {
	const log = args.join(" -> ");
	// console.log(log);
	winstonLogger.logTime(log);
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
	debug
};
