import { getCommand } from "api/controllers/CommandsController";
import { Client, CommandInteraction, User } from "discord.js";
import commandCategory from "commandCategories/index";
import { CommandCategoryProps } from "@customTypes/command";
import { checkUserBanned } from "../checkUserBanned";
import { sanitizeArgs } from "helpers";
import loggers from "loggers";
import { titleCase } from "title-case";

const prepareArgsFromInteraction = (name: string, context: CommandInteraction) => {
	const args: string[] = [];
	switch (name) {
		case "profile": {
			const options: any = context.options.getMentionable("user");
			if (options && options.user && !options.user.bot) {
				args.push(options.user.id);
			}
			context.reply({
				content: "Viewing izzi profile",
				ephemeral: true 
			});
			break;
		}
		case "battle": {
			const options = context.options.getString("hide-battle");
			if (options) {
				args.push("hidebt");
			}
			context.reply({
				content: "Starting floor battle",
				ephemeral: true 
			});
			break;
		}
		case "customcard": {
			const options: any = context.options.getMentionable("user");
			if (options && options.user && !options.user.bot) {
				args.push(options.user.id);
			}
			context.reply({
				content: "Viewing custom profile",
				ephemeral: true 
			});
			break;	
		}
		default:
			context.reply({
				content: `__${titleCase(name)}__ command used`,
				ephemeral: true 
			});
			break;
	}
	return args;
};

const handleCommandInteraction = async (client: Client, context: CommandInteraction) => {
	try {
		const cmd = context.commandName;
		const command = await getCommand(cmd);
		if (!command) {
			return context.reply({
				content: "Please use a valid command",
				ephemeral: true 
			});
		}
		if (
			typeof commandCategory[command?.type as keyof CommandCategoryProps] !== "function"
		)
			return;

		const args = [ command.name, ...prepareArgsFromInteraction(command.name, context) ];
		const isValid = await checkUserBanned(context, client, context.user, command.name);
		if (!isValid) return;
		loggers.info(`Interaction Command ${command.name} invoked by uid: ${context.user.id} with args: ` +
		JSON.stringify(args));
		commandCategory[command?.type as keyof CommandCategoryProps]({
			client,
			context,
			command,
			args: sanitizeArgs(args),
			options: { author: context.user }
		});	
	} catch (err) {
		loggers.error("handleCommandInteraction: ERROR", err);
	}
	// try {
	// 	await context.deferReply({ ephemeral: true });
	// 	const options = context.options;
	// 	const content = options.getString("options");
	// 	// let args = [ "iz", ...(content || "").split(/\s+/) ];
	// 	const args = (content || "").split(/\s+/);
	// 	const commandName = args[0];
	// 	if (!commandName) return;
	// 	context.content = content || "";
		
	// 	// if (command.name === "guild") {
	// 		// args = [ "iz", ...(content || "").split(/\s+/) ];
	// 	// }
	// 	const isValid = await checkUserBanned(context, client, context.user, command.name);
	// 	if (!isValid) return;
	// 	commandCategory[command?.type as keyof CommandCategoryProps]({
	// 		client,
	// 		context,
	// 		command,
	// 		args: sanitizeArgs(args),
	// 		options: { author: context.user }
	// 	});
	// } catch (err) {
	// 	loggers.error("events.interaction.handleCommandInteraction: ERROR", err);
	// }
	return;
};

export default handleCommandInteraction;
