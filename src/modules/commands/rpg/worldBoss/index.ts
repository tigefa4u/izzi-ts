import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { battleWB } from "./battle";
import { viewWorldBossLB } from "./leaderboard";
import { viewWorldBossPlayerLogs } from "./logs";
import { worldBossShop } from "./shop";
import { subcommands } from "./subcommands";
import { viewWorldBoss } from "./view";

export const worldBossCommands = async (params: BaseProps) => {
	try {
		const args = params.args.shift();
		const cmd = filterSubCommands(args || "view", subcommands);
		if (cmd === "view") {
			viewWorldBoss(params);
		} else if (cmd === "battle") {
			battleWB(params);
		} else if (cmd === "logs") {
			viewWorldBossPlayerLogs(params);
		} else if (cmd === "leaderboard") {
			viewWorldBossLB(params);
		} else if (cmd === "shop") {
			// worldBossShop(params);
		}
		return;
	} catch (err) {
		loggers.error("rpg.worldBoss.index.worldBossCommands: ERROR", err);
		return;
	}
};