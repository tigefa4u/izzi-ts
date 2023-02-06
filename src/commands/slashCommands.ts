import { getAllCommands } from "api/controllers/CommandsController";
import { ApplicationCommandDataResolvable, Client, Constants } from "discord.js";
import loggers from "loggers";

export const registerSlashCommands = async (client: Client) => {
	try {
		// const guildId = "784087004806774815";
		// const guild = client.guilds.cache.get(guildId);

		const registerCommands = [ {
			name: "help",
			default_permission: true,
			description: "List all commands available."
		}, {
			name: "battle",
			default_permission: true,
			description: "Battles the current arena and the floor you are on.",
			options: [
				{
					name: "hide-battle",
					description: "Fast forward to the end of the battle outcome.",
					type: Constants.ApplicationCommandOptionTypes.STRING
				}
			]
		}, {
			name: "profile",
			default_permission: true,
			description: "Check a users' izzi profile.",
			options: [
				{
					name: "user",
					description: "Mention a user to view their izzi profile.",
					type: Constants.ApplicationCommandOptionTypes.MENTIONABLE
				}
			]
		}, {
			name: "daily",
			default_permission: true,
			description: "Get Gold, Shards and more rewards for voting on Topgg."
		}, {
			name: "customcard",
			default_permission: true,
			description: "Check a users' custom profile.",
			options: [
				{
					name: "user",
					description: "Mention a user to view their custom profile.",
					type: Constants.ApplicationCommandOptionTypes.MENTIONABLE
				}
			]
		} ] as ApplicationCommandDataResolvable[];

		await client?.application?.commands.set([]).catch((err) => {
			throw err;
		});
		const commands = client?.application?.commands;
		// const commands = guild?.commands;
		await Promise.all(registerCommands.map((cmd) => commands?.create(cmd)));
		// commands?.create({
		// 	name: "iz",
		// 	description: "use ``/iz help``. You can also **Ping** the bot to invoke commands.",
		// 	options: [
		// 		{
		// 			name: "options",
		// 			description: "use <commands> to invoke izzi",
		// 			type: Constants.ApplicationCommandOptionTypes.STRING,
		// 		},
		// 	],
		// });
		console.log("registered slash command");
		loggers.info("Registered slash commands");
		// const allCommands = await getAllCommands();
		// if (!allCommands) return;
		// // Not working
		// allCommands.forEach(async (command) =>
		// 	commands?.cache
		// 		.find((c) => c.name === command.name)
		// 		?.delete()
		// );
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
	} catch (err) {
		loggers.error("commands.slashCommands.registerSlashCommands: ERROR", err);
		return;
	}
};
