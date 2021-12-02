"use strict";

import config from "../../../../env";

const handleClient = (client: any, discord: any) => {
	// handleGuildEvents(client, discord);
	client.on("ready", async () => {
		console.log("listening");
		client.user.setPresence({
			activity: {
				name: `iz help | ${config.IZZI_WEBSITE}`,
				type: "LISTENING",
			},
		});
		try {
			// handleMusicEvents(client, discord);
			// client.music.init(client.user.id);
			// client.musicQueue = new Map();
			// erelajs for streaming music from lavalink service
			if (client.shard.ids.includes(0)) {
				// client.user.setAvatar("./izzi.jpeg")
				console.log(`Logged in as ${client.user.tag}!`);
				// setInterval(async () => {
				// await redisClient.flushAll();
				// }, 1000 * 60 * 60 * 2);
			}
		} catch (err) {
			return;
		}
	});
};

export default handleClient;
