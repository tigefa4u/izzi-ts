/* eslint-disable no-undef */
"use strict";

import discord from "discord.js";
import { DISCORD_TEST_BOT, DISCORD_BOT_TOKEN } from "../environment";
import { handleClient, handleClientEvents } from "handlers/client";
import "../module";
import loggers from "loggers";
import flushBattleCooldowns from "./autoClear/index";
import { autoClear } from "modules/commands/rpg/adventure/battle/battlesPerChannelState";

process.on("unhandledRejection", (error, promise) => {
	autoClear();
	loggers.error("UnhandledRejection: " + error + "promise was: " + promise, error);
});

process.on("uncaughtException", async (error) => {
	await flushBattleCooldowns();
	loggers.error("UNCAUGHT_EXCEPTION FATAL ERROR: ", error);
	// process.exit(1);
});

process.on("exit", async () => {
	await flushBattleCooldowns();
	loggers.error("BOT_CRASHED FATAL ERROR: process has exited unexpectedly", {});
});

// process.setMaxListeners(100);

const client = new discord.Client({
	partials: [ "MESSAGE", "REACTION", "CHANNEL" ],
	retryLimit: 5,
	intents: [ discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MESSAGES ],
	sweepers: {
		messages: {
			lifetime: 1,
			interval: 1
		},
		threads: {
			lifetime: 1,
			interval: 1
		},
		invites: {
			lifetime: 1,
			interval: 1
		}
	},
	restRequestTimeout: 1000 * 30,
	restTimeOffset: 1000
});

handleClient(client);
handleClientEvents(client);

client.login(DISCORD_BOT_TOKEN);
// client.login(DISCORD_TEST_BOT);
