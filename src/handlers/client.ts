import { registerSlashCommands } from "commands/slashCommands";
import { Client, Message } from "discord.js";
import { validateChannelPermissions } from "helpers";
import loggers from "loggers";
import {
	handleDiscordServerJoin,
	handleDiscordServerLeave,
} from "modules/events/guild";
import handleCommandInteraction from "modules/events/interaction";
import handleMessage from "modules/events/message";
import { IZZI_WEBSITE } from "../environment";

export const handleClientEvents = (client: Client) => {
	client.on("warn", (warning) => {
		console.log({ warning });
	});
	client.on("debug", (debug) => {
		loggers.debug(debug);
		// if (debug.toLowerCase().includes("heartbeat")) {
		// 	console.log({ debug });
		// }
		// loggers.logApi("get", "[DEBUG]", debug);
	});

	// client.on("apiRequest", (req) => {
	// 	loggers.logApi(req.method, "[PRE APIRequest] path: ", req.path, req.route);
	// });

	client.on("apiResponse", (req, res) => {
		// loggers.logApi(req.method, "[POST APIRequest] path: ", req.path, req.route);
		// loggers.logApi(req.method, `[APIResponse]: status: ${res.status}, status text: ${res.statusText}`);
	});

	client.on("messageCreate", (context: Message) => {
		const hasPermissions = validateChannelPermissions(context);
		const cannotProcessContext =
      context.author.bot ||
      context.channel.type === "DM" ||
      !context.guild ||
	  !hasPermissions;

		if (cannotProcessContext) return;
		handleMessage(client, context);
	});

	client.on("interactionCreate", (interaction) => {
		if (interaction.isCommand() && validateChannelPermissions(interaction)) {
			handleCommandInteraction(client, interaction);
		}
	});

	client.on("guildCreate", (guild) => {
		handleDiscordServerJoin(client, guild);
	});

	client.on("guildDelete", (guild) => {
		handleDiscordServerLeave(guild);
	});
};

export const handleClient = (client: Client) => {
	// handleGuildEvents(client, discord);
	client.on("ready", async () => {
		console.log("listening");
		// registerSlashCommands(client);
		client?.user?.setPresence({
			activities: [
				{
					name: IZZI_WEBSITE,
					type: 3,
				},
			],
		});
		try {
			// handleMusicEvents(client, discord);
			// client.music.init(client.user.id);
			// client.musicQueue = new Map();
			// erelajs for streaming music from lavalink service
			if (client?.shard?.ids.includes(0)) {
				// client.user.setAvatar("./izzi.jpeg")
				console.log(`Logged in as ${client?.user?.tag}!`);
				// setInterval(async () => {
				// await redisClient.flushAll();
				// }, 1000 * 60 * 60 * 2);
			}
		} catch (err) {
			loggers.error("handlers.handleClient(): APP CRASHED", err);
			return;
		}
	});
};
