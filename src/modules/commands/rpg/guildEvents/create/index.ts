import { BaseProps } from "@customTypes/command";
import loggers from "loggers";

export const addGuildEvent = async ({ context, options, client }: BaseProps) => {
	try {
		context.channel?.sendMessage("Coming soon...");
		return;
	} catch (err) {
		loggers.error("commands.rpg.guildEvents.create.addGuildEvent(): something went wrong", err);
		return;
	}
};