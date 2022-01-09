import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { fetchParamsFromArgs } from "utility/forParams";
import { subcommands } from "./subcommands";

export const market = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options?.author;
		if (!author) return;
		const cmd = args[0];
		const subcommand = filterSubCommands(cmd, subcommands);
		if (subcommand === "buy") {
			return;
		}
		const params = fetchParamsFromArgs(args);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.market.market(): something went wrong",
			err
		);
		return;
	}
};
