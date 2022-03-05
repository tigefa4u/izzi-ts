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
	// console.info(infoMessage);
	winstonLogger.info(infoMessage);
};

export default {
	error,
	info 
};
