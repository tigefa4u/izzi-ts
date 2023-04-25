import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { showDgBans } from "./bans";
import { dungeonBattle } from "./battle";
import { viewDGBattleLog } from "./battleLog";
import { createDGTeam } from "./create";
import { equipDGItem } from "./equipItem";
import { dgTeamReady } from "./ready";
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
		} else if (cmd === "equip") {
			equipDGItem(params);
		} else if (cmd === "bans") {
			showDgBans(params);
		} else if (cmd === "ready") {
			dgTeamReady(params);
		}
		return;
	} catch (err) {
		loggers.error("dungeon.v2.index.dungeonFunc: ERROR", err);
		return;
	}
};