import { CommandCategoryProps, CommandMapProps } from "@customTypes/command";
import { Client, Message } from "discord.js";
import commandCategory from "commandCategories/index";
import { getCommand } from "api/controllers/CommandsController";

const prefix = "tt";

const handleMessage = async (client: Client, message: Message) => {
	const { content, channel } = message;
	const args = content.toLowerCase().split(/\s+/);
	if (args[0] !== prefix || !args[1]) return;
	const command = await getCommand(args[1]);
	if (!command) return;
	args.shift();
	if (
		typeof commandCategory[command?.type as keyof CommandCategoryProps] !== "function"
	)
		return;
	commandCategory[command?.type as keyof CommandCategoryProps]({
		client,
		message,
		command,
		args,
		options: { author: message.author }
	});
	return;
};

export default handleMessage;
