import loggers from "loggers";
import { get } from "../models/ChangeLogs";

export const getChangeLogs = async () => {
	try {
		return get();
	} catch (err) {
		loggers.error("ChangeLogsController.getChangeLogs: ERROR", err);
		return;
	}
};