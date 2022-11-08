import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { useReferrals } from "./refer";
import { subcommands } from "./subcommands";
import { viewReferrals } from "./view";

export const userReferrals = async (params: BaseProps) => {
	try {
		const cmd = params.args[0];
		let subcommand = filterSubCommands(cmd, subcommands);
		if (!subcommand) subcommand = "view";
		if (subcommand === "use") {
			params.args.shift();
			useReferrals(params);
		} else if (subcommand === "view") {
			viewReferrals(params);
		}
		return;
	} catch (err) {
		loggers.error("basic.referrals.userReferrals: ERROR", err);
		return;
	}
};