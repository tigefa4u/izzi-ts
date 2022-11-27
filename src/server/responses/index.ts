import { ERROR_CONSTANTS } from "server/helpers/errorConstants";

export const notFound = (res: any, message: string) => {
	return res.status(404).send({
		code: ERROR_CONSTANTS.NOT_FOUND,
		error: true,
		message: message || "Not found"
	});
};

export const error = (res: any, status: number, message: string, code?: string) => {
	return res.status(status || 400).send({
		code: code || ERROR_CONSTANTS.BAD_REQUEST,
		error: true,
		message: message || "Bad request"
	});
};

export const success = (res: any, data: any) => {
	return res.status(200).send({
		success: true,
		data
	});
};