/* eslint-disable no-undef */
"use strict";

import discord from "discord.js";
import { DISCORD_TEST_BOT, DISCORD_BOT_TOKEN } from "../environment";
import { handleClient, handleClientEvents } from "handlers/client";
import "../module";
import loggers from "loggers";
import flushCache from "./autoClear/index";

process.on("unhandledRejection", (error, promise) => {
	loggers.error("UnhandledRejection: " + error + "promise was: " + promise, error);
});

process.on("uncaughtException", async (error) => {
	loggers.error("BOT CRASHED, FATAL ERROR: ", error);
	await flushCache();
	process.exit(1);
});

// process.setMaxListeners(100);

const client = new discord.Client({
	partials: [ "MESSAGE", "REACTION", "CHANNEL" ],
	retryLimit: 5,
	intents: [ discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MESSAGES ],
	sweepers: {
		messages: {
			lifetime: 2,
			interval: 2
		},
		threads: {
			lifetime: 2,
			interval: 2
		},
		invites: {
			lifetime: 2,
			interval: 2
		}
	}
	// restRequestTimeout: 1000 * 25
});

handleClient(client);
handleClientEvents(client);

client.login(DISCORD_BOT_TOKEN);
// client.login(DISCORD_TEST_BOT);
