import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { getIdFromMentionedString } from "helpers";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import { filterSubCommands } from "helpers/subcommands";
import { prepareAndSendConsoleMenu } from "implementations/consoleButtons";
import loggers from "loggers";
import { titleCase } from "title-case";
import { abandonTeammate } from "./abandonTeammate";
import { subcommands } from "./subcommands";
import { teamUp } from "./tagTeam";

const raids: { [key: string]: string } = {
	i: "immortal",
	e: "easy",
	m: "medium",
	h: "hard"
};
export const console = async (params: BaseProps) => {
	try {
		const { client, context, options, args } = params;
		const cmd = args.shift();
		const { author } = options;
		if (cmd) {
			const subcommand = filterSubCommands(cmd, subcommands);
			const key = "anonymous-market-purchase::" + author.id;
			if (subcommand === "hidemk") {
				Cache.set(key, JSON.stringify({ anonymousMarketPurchase: true }));
				context.channel?.sendMessage(`Summoner **${author.username}**, Your username ` +
			"will no longer be visible to the seller on the Global Market.");
				return;
			} else if (subcommand === "showmk") {
				Cache.del(key);
				context.channel?.sendMessage(`Summoner **${author.username}**, Your username ` +
			"will now be visible to the seller on the Global Market.");
				return;
			} else if (subcommand === "tag-team") {
				teamUp(params);
				return;
			} else if (subcommand === "abandon") {
				abandonTeammate(params);
				return;
			}
		}
		prepareAndSendConsoleMenu({
			channel: context.channel,
			user_tag: options.author.id,
			client,
			id: "",
			message: context as Message
		});
		return;
	} catch (err) {
		loggers.error("rpg.console: ERROR", err);
		return;
	}
};