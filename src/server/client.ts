/* eslint-disable no-undef */
"use strict";

import * as dotenv from "dotenv";
dotenv.config();

import discord from "discord.js";
import config from "../../env";
import handleClient from "../modules/events/client";

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
    intents: 0,
    // restRequestTimeout: 1000 * 25
});

// clientEvents(client);
handleClient(client, discord);

// client.login(config.DISCORD_BOT_TOKEN);
client.login(config.DISCORD_TEST_BOT);
