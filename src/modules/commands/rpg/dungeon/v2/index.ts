import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { dungeonBattle } from "./battle";
import { viewDGBattleLog } from "./battleLog";
import { createDGTeam } from "./create";
import { removeDGTeam } from "./remove";
import { resetDGTeam } from "./reset";
import { setDGTeam } from "./set";
import { subcommands } from "./subcommands";
import { viewDGTeam } from "./view";

export const dungeonFunc = async (params: BaseProps) => {
	try {
		const args = params.args;
		const cmd = filterSubCommands(args.shift()?.toLowerCase() || "bt", subcommands) || "battle";
		if (cmd === "battle") {
			dungeonBattle(params);
		} else if (cmd === "view") {
			viewDGTeam(params);
		} else if (cmd === "set") {
			setDGTeam(params);
		} else if (cmd === "reset") {
			resetDGTeam(params);
		} else if (cmd === "create") {
			createDGTeam(params);
		} else if (cmd === "remove") {
			removeDGTeam(params);
		} else if (cmd === "battle-log") {
			viewDGBattleLog(params);
		}
		return;
	} catch (err) {
		loggers.error("dungeon.v2.index.dungeonFunc: ERROR", err);
		return;
	}
};