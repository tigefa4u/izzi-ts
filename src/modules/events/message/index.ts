import { CommandCategoryProps } from "@customTypes/command";
import { Client, Message } from "discord.js";
import commandCategory from "commandCategories/index";
import { getCommand } from "api/controllers/CommandsController";
import { BOT_PREFIX, DISCORD_CLIENT_ID } from "environment";
import { sanitizeArgs } from "helpers";


const handleMessage = async (client: Client, context: Message) => {
	const { content } = context;
	let args = content.toLowerCase().split(/\s+/);
	const botId = `<@!${DISCORD_CLIENT_ID}>`;
	if (!(args[0] === BOT_PREFIX || args[0] === botId) || !args[1]) return;
	const command = await getCommand(args[1]);
	if (!command) return;
	args.shift();
	if (
		typeof commandCategory[command?.type as keyof CommandCategoryProps] !== "function"
	)
		return;
	if (command.name === "guild") {
		args = content.split(/\s+/);
		args.shift();
	}
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
