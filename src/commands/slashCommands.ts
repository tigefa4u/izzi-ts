import { getAllCommands } from "api/controllers/CommandsController";
import { Client, Constants, GuildApplicationCommandManager } from "discord.js";
import loggers from "loggers";

export const registerSlashCommands = async (client: Client) => {
	const guildId = "784087004806774815";

	const guild = client.guilds.cache.get(guildId);
	let commands: any;
	if (guild) {
		commands = guild.commands;
	} else {
		// commands = client?.application?.commands;
	}
	commands?.create({
		name: "give",
		description: "give le bot",
		options: [ {
			name: "options",
			description: "Command options same as direct commands",
			type: Constants.ApplicationCommandOptionTypes.STRING
		} ]
	});
	// const allCommands = await getAllCommands();
	// if (!allCommands) return;
	// allCommands.forEach(async (command) => {
	// 	try {
	// 		await commands
	// 			?.create({
	// 				name: command.name,
	// 				description: "The command probably does what it says",
	// 				options: [
	// 					{
	// 						name: "options",
	// 						description: "The command probably does what it says",
	// 						type: Constants.ApplicationCommandOptionTypes.STRING,
	// 					},
	// 				],
	// 			});
	// 	} catch (err) {
	// 		loggers.error(
	// 			"Slash Commands registration failed for: " +
	// 	command.name +
	// 	"desc: " +
	// 	command.description,
	// 			err
	// 		);
	// 	}
	// });
	// console.log(`registered ${allCommands.length} commands--`);
	return;
};
