import { BaseProps } from "@customTypes/command";
import { DzFuncProps } from "@customTypes/darkZone";
import { getDarkZoneProfile } from "api/controllers/DarkZoneController";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { listDzCommands } from "./actions/listDzCommands";
import { startDz } from "./actions/start";
import { viewDzProfile } from "./actions/viewProfile";
import { subcommands } from "./subcommands";

export const invokeDarkZone = async (params: BaseProps) => {
	try {
		const cmd = filterSubCommands(params.args.shift() || "commands", subcommands) || "commands";
		if (cmd === "commands") {
			listDzCommands(params);
			return;
		}
		const dzUser = await getDarkZoneProfile({ user_tag: params.options.author.id });
		if (cmd === "start") {
			startDz({
				...params,
				dzUser
			});
			return;
		}
		if (!dzUser) {
			params.context.channel?.sendMessage(
				`Summoner **${params.options.author.username}**, You have not started your ` +
                "journey in the Dark Zone. Type `iz dz start`, you must be at least level 50."
			);
			return;
		}
		const paramObject: DzFuncProps = {
			...params,
			dzUser
		};
		if (cmd === "profile") {
			viewDzProfile(paramObject);
		}
		return;
	} catch (err) {
		loggers.error("invokeDarkZone: ERROR", err);
		return;
	}
};