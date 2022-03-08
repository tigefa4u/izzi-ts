import { AUTH_TOKEN } from "environment";


const isAuth = (req: any, res: any, next: any) => {
	if (req.headers["authorization"]) {
		const token = req.headers["authorization"].split("Bot ")[1];
		if (token === AUTH_TOKEN) {
			return next();
		}
	}
	return res.status(401).send({
		error: true,
		message: "Unauthorized",
		code: 401
	});
};

export default isAuth;