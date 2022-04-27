import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { subcommands } from "./subcommands";
import * as SkinActions from "./skinActions";
import { resolveSkin } from "./resolver";

export const skins = ({ context, args, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const opt = args.shift() || "show";
		const subcommand = filterSubCommands(opt, subcommands);
		const params = {
			author,
			channel: context.channel,
			client,
			args
		};
		if (subcommand === "show") {
			SkinActions.show(params);
		} else if (subcommand === "reset") {
			SkinActions.reset(params);
		} else if (subcommand === "choose") {
			SkinActions.choose(params);
		} else if (subcommand === "resolve") {
			resolveSkin(params);
		} else if (subcommand === "remove") {
			SkinActions.removeSkin(params);
		}
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.skins.skins(): something went wrong", err);
		return;
	}
};