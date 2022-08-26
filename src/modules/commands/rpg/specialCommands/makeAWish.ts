import { BaseProps } from "@customTypes/command";
import loggers from "loggers";

export const makeAWish = async ({ client, context, args, options }: BaseProps) => {
	try {
		const author = options.author;
		return;
	} catch (err) {
		loggers.error("specialCommands.makeAWish(): something went wrong", err);
		return;
	}
};