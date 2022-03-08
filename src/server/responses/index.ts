export const notFound = (res: any, message: string) => {
	return res.status(404).send({
		code: 404,
		error: true,
		message: message || "Not found"
	});
};

export const error = (res: any, code: number, message: string) => {
	return res.status(code || 400).send({
		code: code || 400,
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