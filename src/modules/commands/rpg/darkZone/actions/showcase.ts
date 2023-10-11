import { DzFuncProps } from "@customTypes/darkZone";
import loggers from "loggers";

export const showcaseDzCard = async ({ context, dzUser, options, args }: DzFuncProps) => {
	try {
		const { author } = options;
		return;
	} catch (err) {
		loggers.error("showcaseDzCard: ERROR", err);
		return;
	}
};