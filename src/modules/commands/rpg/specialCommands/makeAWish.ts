import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { sort } from "../sorting";
import { makeAWishHelp } from "./help";
import {
	addRaidDamage,
	addWorldBossDamage,
	forceStartJourney,
	setCharacterLevel,
	setCharacterRank,
	showTotalUserDonations,
	updateDono,
} from "./hoaxCommands";
import { spawnWorldBoss } from "./worldboss/spawn";
import { specialWish } from "./specialWish";
import { subcommands } from "./subcommands";
import { startWB } from "./worldboss/start";
import { finishWB } from "./worldboss/end";
import { sendSpawnMessage } from "./worldboss/sendMessage";
import { clear as clearImageCache } from "cache/imageCache";
import { OWNER_DISCORDID } from "environment";

const wishesFrom = [ OWNER_DISCORDID ];
export const makeAWish = async (params: BaseProps) => {
	try {
		const { context, options, args } = params;
		const author = options.author;
		if (!wishesFrom.includes(author.id)) {
			console.log("Pray to the wishing well.");
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
			} else if (subcommand === "wspawn") {
				spawnWorldBoss(params);
				return;
			} else if (subcommand === "wstart") {
				startWB(params);
				return;
			} else if (subcommand === "wend") {
				finishWB(params);
				return;
			} else if (subcommand === "wdmg") {
				addWorldBossDamage(params);
				return;
			} else if (subcommand === "wsend") {
				sendSpawnMessage(params);
				return;
			} else if (subcommand === "force-start") {
				forceStartJourney(params);
				return;
			} else if (subcommand === "donation") {
				showTotalUserDonations(params);
				return;
			} else if (subcommand === "donated") {
				updateDono(params);
				return;
			} else if (subcommand === "clearimagecache") {
				if (author.id !== OWNER_DISCORDID) {
					context.channel?.sendMessage(
						"You are not allowed to use this command"
					);
					return;
				}
				clearImageCache();
				context.channel?.sendMessage("Hoax, Disk image cache has been cleared");
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
