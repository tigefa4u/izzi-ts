import { getAllCommands } from "api/controllers/CommandsController";
import { Client, Constants, GuildApplicationCommandManager } from "discord.js";

export const registerSlashCommands = async (client: Client) => {
	const guildId = "766953548067766273";

	const guild = client.guilds.cache.get(guildId);
	let commands: GuildApplicationCommandManager;
	if (guild) {
		commands = guild.commands;
	} else {
		// commands = client?.application?.commands;
	}
	// commands?.create({
	// 	name: "give",
	// 	description: "give le bot",
	// 	options: [ {
	// 		name: "options",
	// 		description: "Command options same as direct commands",
	// 		type: Constants.ApplicationCommandOptionTypes.STRING
	// 	} ]
	// });
	const allCommands = await getAllCommands();
	if (!allCommands) return;
	allCommands.map((command) => {
	    commands?.create({
	        name: command.name,
	        description: command.description || "The command probably does what it says",
	        options: [ {
	            name: "options",
	            description: "Command options same as direct commands",
	            type: Constants.ApplicationCommandOptionTypes.STRING
	        } ]
	    });
	});
	console.log("registered all commands--");
	return;
};