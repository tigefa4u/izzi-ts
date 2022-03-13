import { CommandCategoryProps } from "@customTypes/command";
import { Client, Message } from "discord.js";
import commandCategory from "commandCategories/index";
import { getCommand } from "api/controllers/CommandsController";
import { BOT_PREFIX, DISCORD_CLIENT_ID } from "environment";
import { getIdFromMentionedString, sanitizeArgs } from "helpers";
import { checkUserBanned } from "../checkUserBanned";
import { dropCollectables } from "modules/collectables";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";

const handleMessage = async (client: Client, context: Message) => {
	const { content } = context;
	const cd = await getCooldown(context.author.id, "command-cd");
	if (cd) {
		sendCommandCDResponse(context.channel, cd, context.author.id, "command-cd");
		return;
	}
	let args = content.toLowerCase().split(/\s+/);
	const botId = getIdFromMentionedString(args[0]);
	if (!(botId === BOT_PREFIX || botId === DISCORD_CLIENT_ID) || !args[1]) {
		if (context.guild?.id) {
			dropCollectables({
				client,
				author: context.author,
				guild: context.guild,
				channel: context.channel
			});
		}
		return;
	}
	const command = await getCommand(args[1]);
	if (!command) return;
	setCooldown(context.author.id, "command-cd", 1);
	args.shift();
	if (
		typeof commandCategory[command?.type as keyof CommandCategoryProps] !== "function"
	)
		return;
	if (command.name === "guild" || command.name === "team") {
		args = content.split(/\s+/);
		args.shift();
	}
	const isValid = await checkUserBanned(context, client, context.author, command.name);
	if (!isValid) return;
	commandCategory[command?.type as keyof CommandCategoryProps]({
		client,
		context,
		command,
		args: sanitizeArgs(args),
		options: { author: context.author }
	});
	return;
};

export default handleMessage;
