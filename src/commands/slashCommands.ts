import { getAllCommands } from "api/controllers/CommandsController";
import { Client, Constants, GuildApplicationCommandManager } from "discord.js";
import loggers from "loggers";

export const registerSlashCommands = async (client: Client) => {
	const guildId = "784087004806774815";

	const guild = client.guilds.cache.get(guildId);
	// if (guild) {
	const commands = guild?.commands;
	// } else {
	// const commands = client?.application?.commands;
	// }
	commands?.create({
		name: "iz",
		description: "use /iz <commands>, use /help for a list of all commands",
		options: [
			{
				name: "options",
				description: "use <commands> to invoke izzi",
				type: Constants.ApplicationCommandOptionTypes.STRING
			}
		]
	});
	console.log("registered slash command");
	// const allCommands = await getAllCommands();
	// if (!allCommands) return;
	// allCommands.forEach(async (command) => {
	// 	try {
	// 		await commands
	// 			?.create({
	// 				name: command.name,
	// 				description: `use /help or @izzi help ${command.name} for more info`,
	// 				options: [
	// 					{
	// 						name: "options",
	// 						description: `use /help or @izzi help ${command.name} for more info`,
	// 						type: Constants.ApplicationCommandOptionTypes.STRING,
	// 					},
	// 				],
	// 			});
	// 	} catch (err) {
	// 		loggers.error(
	// 			"Slash Commands registration failed for: " +
	// 	command.name,
	// 			err
	// 		);
	// 	}
	// });
	// console.log(`registered ${allCommands.length} slash commands`);
	return;
};
