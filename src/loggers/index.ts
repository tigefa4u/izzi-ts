import winstonLogger from "./winston";

const error = (errMessage: string, err: unknown) => {
	let errorMessage = "Unknown Error";
	if (err instanceof Error) {
		errorMessage = err.message;
	}
	console.error(errMessage, errorMessage);
	// winstonLogger.error(errorMessage + JSON.stringify(errorMessage));
};

const info = (infoMessage: string) => {
	console.info(infoMessage);
	// winstonLogger.info(infoMessage);
};

export default {
	error,
	info 
};
