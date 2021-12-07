/* eslint-disable no-undef */
"use strict";

import discord from "discord.js";
import { DISCORD_TEST_BOT, DISCORD_BOT_TOKEN } from "../env";
import { handleClient, handleClientEvents } from "../handlers/client";
import "../module";

// app.use(
//   cors({
//     // origin: "*",
//     origin: config.IZZI_WEBSITE
//   })
// );

// const http = require("http").createServer(app);
// require("../socket/utils").listen(http);

// const webhook = new Topgg.Webhook("izziwebhookauth");

// process.on("unhandledRejection", (error, promise) => {
// 	logger.error("UnhandledRejection: " + error + "promise was: " + promise);
// });

// process.on("uncaughtException", async (error) => {
// 	logger.error("BOT CRASHED, FATAL ERROR: " + error);
// 	const cleanup = require("./cleanup");
// 	await cleanup();
// 	process.exit(1);
// });

// process.setMaxListeners(100);

const client = new discord.Client({
    partials: [ "MESSAGE", "REACTION", "CHANNEL" ],
    messageSweepInterval: 2,
    messageCacheLifetime: 2,
    retryLimit: 5,
    intents: [discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MESSAGES],
    // restRequestTimeout: 1000 * 25
});

handleClient(client);
handleClientEvents(client);

// client.login(config.DISCORD_BOT_TOKEN);
client.login(DISCORD_TEST_BOT);
