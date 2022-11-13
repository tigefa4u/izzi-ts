import { AuthorProps } from "@customTypes";
import { CommandProps } from "@customTypes/command";
import loggers from "loggers";

export const logCommand = (author: AuthorProps, command: CommandProps, args: string[]) => {
	try {
		loggers.info(
			`command ${command.name} used by ${author.username} (${author.id}) ` +
            `-> bot: ${author.bot}, discriminator: ${author.discriminator} -> with arguments: ${JSON.stringify(args)}`
		);
	} catch (err) {
		loggers.error("message.logCommand: Unable to log command, ERROR", err);
	}
	return;
};
