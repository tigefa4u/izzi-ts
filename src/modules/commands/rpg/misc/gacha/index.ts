import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { epicPack, legendaryPacks, silverPacks } from "./gachapacks";
import { subcommands } from "./subcommands";

export const gachaPacks = async (params: BaseProps) => {
	try {
		const { context, args } = params;
		const cmd = args.shift();
		if (!cmd) {
			context.channel?.sendMessage("Please enter a valid pack");
			return;
		}
		const command = filterSubCommands(cmd, subcommands);
		if (command === "epic") {
			epicPack(params);
		} else if (command === "silver") {
			silverPacks(params);
		} else if (command === "legendary") {
			legendaryPacks(params);
		}
		return;
	} catch (err) {
		loggers.error("misc.gacha.gachaPacks: ERROR", err);
		return;
	}
};