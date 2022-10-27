import { BaseProps } from "@customTypes/command";
import loggers from "loggers";
import { help } from "modules/commands/basic";

export const premium = ({ context, client, options }: BaseProps) => {
	try {
		help({
			context,
			client,
			args: [ "premium" ],
			options
		});
		return;
	} catch (err) {
		loggers.error("module.commands.rpg.premium.premium: ERROR", err);
		return;
	}
};