import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { addGuildEvent } from "./create";
import { resetGuildEvents } from "./dangerZone";
import { raidPing } from "./raidPing";
import { raidRecruit } from "./recruit";
import { subcommands } from "./subcommands";
import { viewGuilldEvents } from "./view";

export const guildEvents = async ({ context, client, args, options }: BaseProps) => {
	try {
		const subcommand = filterSubCommands(args.shift() || "view", subcommands);
		const params = {
			context,
			client,
			options,
			args,
		};
		if (subcommand === "create") {
			addGuildEvent(params);
		} else if (subcommand === "view") {
			viewGuilldEvents(params);
		} else if (subcommand === "raidping") {
			raidPing(params);
		} else if (subcommand === "raidrecruit") {
			raidRecruit(params);
		} else if (subcommand === "reset") {
			resetGuildEvents(params);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guildEvents.default(): something went wrong",
			err
		);
		return;
	}
};