import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { sort } from "../sorting";
import { makeAWishHelp } from "./help";
import { addRaidDamage, setCharacterLevel, setCharacterRank } from "./hoaxCommands";
import { specialWish } from "./specialWish";
import { subcommands } from "./subcommands";

const wishesFrom = [ "476049957904711682", "266457718942990337" ];
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
			} else if (subcommand === "chl") {
				setCharacterLevel(params);
				return;
			} else if (subcommand === "help") {
				makeAWishHelp(params);
				return;
			} else if (subcommand === "rdmg") {
				addRaidDamage(params);
				return;
			} else if (subcommand === "chr") {
				setCharacterRank(params);
				return;
			} else if (subcommand === "re") {
				params.args = [ "raid-energy" ];
				specialWish(params);
				return;
			}
		}
		specialWish(params);
		return;
	} catch (err) {
		loggers.error("specialCommands.makeAWish: ERROR", err);
		return;
	}
};