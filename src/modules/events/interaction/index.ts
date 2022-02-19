import { getCommand } from "api/controllers/CommandsController";
import { Client, CommandInteraction } from "discord.js";
import commandCategory from "commandCategories/index";
import { CommandCategoryProps } from "@customTypes/command";
import { checkUserBanned } from "../checkUserBanned";
import { sanitizeArgs } from "helpers";

const handleCommandInteraction = async (client: Client, context: CommandInteraction) => {
	await context.deferReply({ ephemeral: true });
	const options = context.options;
	const content = options.getString("options");
	let args = [ "iz", ...(content || "").split(/\s+/) ];
	const command = await getCommand(context.commandName);
	await context.editReply({ content: "." });
	if (!command) return;
	if (
		typeof commandCategory[command?.type as keyof CommandCategoryProps] !== "function"
	)
		return;
	if (command.name === "guild") {
		args = [ "iz", ...(content || "").split(/\s+/) ];
	}
	const isValid = await checkUserBanned(context, client, context.user, command.name);
	if (!isValid) return;
	commandCategory[command?.type as keyof CommandCategoryProps]({
		client,
		context,
		command,
		args: sanitizeArgs(args),
		options: { author: context.user }
	});
	return;
};

export default handleCommandInteraction;
