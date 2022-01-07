import { BaseProps } from "@customTypes/command";
import loggers from "loggers";
import { help } from "modules/commands/basic";

export const premium = ({ context, client }: BaseProps) => {
	try {
		help({
			context,
			client,
			args: [ "premium" ]
		});
		return;
	} catch (err) {
		loggers.error("module.commands.rpg.premium.premium(): something went wrong", err);
		return;
	}
};