import { BaseProps } from "@customTypes/command";
import { OWNER_DISCORDID } from "environment";
import loggers from "loggers";

export const spawnWorldBoss = async ({ options, client, args, context }: BaseProps) => {
	try {
		const { author } = options;
		if (author.id !== OWNER_DISCORDID) {
			return;
		}
	} catch (err) {
		loggers.error("specialCommands.spawnWorldBoss: ERROR", err);
		return;
	}
};