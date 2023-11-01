import { DzFuncProps } from "@customTypes/darkZone";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { equipDzItem } from "./equip";
import { resetDzTeam } from "./reset";
import { selectDzTeam } from "./select";
import { setDzTeam } from "./set";
import { subcommands } from "./subcommands";
import { viewDzTeam } from "./view";

export const dzTeamCommands = async (params: DzFuncProps) => {
	try {
		const cmd = filterSubCommands(params.args.shift() || "view", subcommands) || "view";
		if (cmd === "view") {
			viewDzTeam(params);
		} else if (cmd === "select") {
			selectDzTeam(params);
		} else if (cmd === "set") {
			setDzTeam(params);
		} else if (cmd === "equip") {
			equipDzItem(params);
		} else if (cmd === "reset") {
			resetDzTeam(params);
		}
		return;
	} catch (err) {
		loggers.error("dzTeamCommands: ERROR", err);
		return;
	}
};