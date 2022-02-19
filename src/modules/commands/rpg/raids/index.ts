import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { fetchParamsFromArgs } from "utility/forParams";
import { raidLobbies } from "./actions/lobbies";
import { spawnRaid } from "./actions/spawn";
import { subcommands } from "./subcommands";

export const raidActions = async ({
	context, client, options, args, command 
}: BaseProps) => {
	try {
		const author = options.author;
		const subcommand = filterSubCommands(args.shift() || "lobbies", subcommands);
		const params = {
			context,
			client,
			args,
			options,
			command,
			isEvent: false
		};
		if (subcommand === "spawn") {
			spawnRaid(params);
		} else if (subcommand === "lobbies") {
			raidLobbies(params);
		}
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.raidActions(): something went wrong", err);
		return;
	}
};