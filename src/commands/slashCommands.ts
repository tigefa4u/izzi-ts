import { Client, Constants } from "discord.js";

export const registerSlashCommands = (client: Client) => {
	const guildId = "784087004806774815";

	const guild = client.guilds.cache.get(guildId);
	let commands;
	if (guild) {
		commands = guild.commands;
	} else {
		commands = client?.application?.commands;
	}
	commands?.create({
		name: "ping",
		description: "Pings the bot",
		options: [ {
			name: "options",
			description: "Command options",
			type: Constants.ApplicationCommandOptionTypes.STRING
		} ]
	});
	// const allCommands = getAllCommands();
	// allCommands.map((command) => {
	//     commands.create({
	//         name: command.name,
	//         description: command.description,
	//         options: [{
	//             name: "options",
	//             description: "Command options",
	//             type: Constants.ApplicationCommandOptionTypes.STRING
	//         }]
	//     });
	// });
	console.log("registered all commands--");
	return;
};