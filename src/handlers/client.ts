import { Client, Interaction, Message } from "discord.js";
import handleMessage from "../modules/events/message";
import { IZZI_WEBSITE } from "../../env";

export const handleClientEvents = (client: Client) => {
    client.on("messageCreate", (message: Message) => {
        if (message.author.bot || message.channel.type === "DM" || !message.guild) return;
        if (message.content === "tt ping") message.channel.sendMessage("pls work");
        // handleMessage(client, message);
    });

    client.on("interactionCreate", (interaction: Interaction) => {
        if (!interaction.isCommand()) return;
    });
};

export const handleClient = (client: Client) => {
	// handleGuildEvents(client, discord);
	client.on("ready", async () => {
		console.log("listening");
		client?.user?.setPresence({
			activities: [{
				name: IZZI_WEBSITE,
				type: 3
			}],
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
			console.log(err);
			return;
		}
	});
};
