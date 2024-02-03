import { ChannelProp } from "@customTypes";
import { registerSlashCommands } from "commands/slashCommands";
import { Client, Guild, Message } from "discord.js";
import {
	checkReadMessagePerms,
	generateUUID,
	validateChannelPermissions,
} from "helpers";
import { OS_LOG_CHANNELS } from "helpers/constants/channelConstants";
import loggers from "loggers";
import { initLoggerContext, setLoggerContext } from "loggers/context";
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
		loggers.debug("debugger", debug);
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

		// Corsspost market logs to other servers.
		// crosspoting was not possible - hit rait limit, can only crosspost 10 per 1 hour.
		// 	if (
		// 		context.channel.id === OS_GLOBAL_MARKET_CHANNEL &&
		//   context.channel.type === "GUILD_NEWS" &&
		//   context.crosspostable
		// 	) {
		// 		context.crosspost();
		// 		return;
		// 	}
		const hasPermissions = validateChannelPermissions(context);
		const hasReadPerms = checkReadMessagePerms(context);

		const cannotProcessContext =
      context.author.bot ||
      context.channel.type === "DM" ||
      !context.guild ||
      !hasReadPerms;

		if (cannotProcessContext) return;
		initLoggerContext(() => {
			setLoggerContext({
				requestId: generateUUID(10),
				userTag: context.author.id,
				serverId: context.guild?.id,
				channelId: context.channel.id,
			});
			handleMessage(client, context, { hasPermissions });
		});
	});

	client.on("interactionCreate", (interaction) => {
		if (interaction.isCommand() && validateChannelPermissions(interaction)) {
			handleCommandInteraction(client, interaction);
		}
	});

	client.on("guildCreate", (guild) => {
		handleDiscordServerJoin(client, guild);
		logServerAdd(guild, client);
	});

	client.on("guildDelete", (guild) => {
		handleDiscordServerLeave(guild);
		logServerLeave(guild, client);
	});
};

const logServerLeave = async (guild: Guild, client: Client) => {
	const logChannel = await client.channels.fetch(OS_LOG_CHANNELS.BOT_SERVER_ADD_LEAVE) as ChannelProp | null;
	if (logChannel) {
		logChannel.sendMessage(`Izzi has left server: ${guild.name} (${guild.id})`);
	}
};

const logServerAdd = async (guild: Guild, client: Client) => {
	const logChannel = await client.channels.fetch(OS_LOG_CHANNELS.BOT_SERVER_ADD_LEAVE) as ChannelProp | null;
	if (logChannel) {
		logChannel.sendMessage(`Izzi was added to server: ${guild.name} (${guild.id})`);
	}
};

export const handleClient = (client: Client) => {
	// handleGuildEvents(client, discord);
	client.on("ready", async () => {
		console.log("listening");
		registerSlashCommands(client);
		client?.user?.setPresence({
			activities: [
				{
					name: `iz help, ${IZZI_WEBSITE}`,
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
				// client.user?.setAvatar("./izzi.jpeg");
				console.log(`Logged in as ${client?.user?.tag}!`);
				loggers.info(`Logged in as ${client?.user?.tag}`);
				// setInterval(async () => {
				// await redisClient.flushAll();
				// }, 1000 * 60 * 60 * 2);
			}
		} catch (err) {
			loggers.error("handlers.handleClient: APP CRASHED", err);
			return;
		}
	});
};
