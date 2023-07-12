import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { addGuildEvent, setPrefix } from "./actions";
import { resetGuildEvents } from "./dangerZone";
import { raidPing } from "./raidPing";
import { abilityPing } from "./raidPing/abilityPing";
import { raidRecruit } from "./recruit";
import { subcommands } from "./subcommands";
import { viewGuilldEvents } from "./view";
import { raidPingView } from "./view/raidPingView";

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
		} else if (subcommand === "abilityping") {
			abilityPing(params);
		} else if (subcommand === "raidpingview") {
			raidPingView(params);
		} else if (subcommand === "prefix") {
			setPrefix(params);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guildEvents.default: ERROR",
			err
		);
		return;
	}
};