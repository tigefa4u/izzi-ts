import { BaseProps } from "@customTypes/command";
import loggers from "loggers";
import { help } from "modules/commands/basic";

export const premium = ({ message, client }: BaseProps) => {
	try {
		help({
			message,
			client,
			args: [ "premium" ]
		});
		return;
	} catch (err) {
		loggers.error("module.commands.rpg.premium.premium: something went wrong", err);
		return;
	}
};