import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { sort } from "../sorting";
import { specialWish } from "./specialWish";
import { subcommands } from "./subcommands";

const wishesFrom = [ "476049957904711682" ];
export const makeAWish = async (params: BaseProps) => {
	try {
		const { context, options, args } = params;
		const author = options.author;
		if (!wishesFrom.includes(author.id)) {
			return;
		}
		const cmd = args.shift();
		if (cmd) {
			const subcommand = filterSubCommands(cmd, subcommands);
			if (subcommand === "sort") {
				sort(params);
				return;
			}
		}
		specialWish(params);
		return;
	} catch (err) {
		loggers.error("specialCommands.makeAWish(): something went wrong", err);
		return;
	}
};