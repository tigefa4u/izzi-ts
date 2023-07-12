import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { toggleTourneyMode } from "./actions";
import { viewTourneySettings } from "./actions/view";
import { subcommands } from "./subcommands";

export const tourneyCommands = async (params: BaseProps) => {
	try {
		const cmd = params.args.shift();
		const command = filterSubCommands(cmd || "view", subcommands) || "view";
		if (command === "toggle") {
			toggleTourneyMode(params);
		} else if (command === "view") {
			viewTourneySettings(params);
		}
		return;
	} catch (err) {
		loggers.error("tournament.index.tourneyCommands: ERROR", err);
		return;
	}
};