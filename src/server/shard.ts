/* eslint-disable no-undef */
import { ShardingManager } from "discord.js";
// import * as dotenv from "dotenv";
// dotenv.config({ path: __dirname + "/../../.env" });
import { DISCORD_TEST_BOT, DISCORD_BOT_TOKEN, SHARD_LIST, TOTAL_SHARDS } from "../environment";

// eslint-disable-next-line no-unused-vars
process.on("unhandledRejection", (error, promise) => {
	// logger.error("UnhandledRejection: " + error);
});

process.on("uncaughtException", (error) => {
	// logger.error("BOT SHARD CRASHED, FATAL ERROR: " + error);
	// process.exit(1);
});

process.setMaxListeners(100);

const shardParams = {
	execArgv: [ "-r", "ts-node/register" ],
	totalShards: TOTAL_SHARDS || "auto",
	respawn: true,
	token: DISCORD_TEST_BOT,
	// token: config.DISCORD_BOT_TOKEN
};

if (SHARD_LIST) {
	Object.assign(shardParams, { shardList: SHARD_LIST });
}

const manager = new ShardingManager("src/server/client.ts", {
	execArgv: [ "-r", "ts-node/register" ],
	totalShards: "auto",
	token: DISCORD_TEST_BOT,
	respawn: true
});

manager.spawn();
manager.on("shardCreate", (shard) => {
	console.log(`Shard #${shard.id} is Online`);
	shard.on("death", (process) => {
		// logger.error(
		// 	"Shard " +
		// shard.id +
		// " closed unexpectedly! PID: " +
		// process.pid +
		// "; Exit code: " +
		// process.exitCode +
		// "."
		// );

		// if (process.exitCode === null) {
		// 	logger.error(
		// 		"WARNING: Shard " +
		//   shard.id +
		//   ` exited with NULL error code. This may be a result of a lack of available system memory. 
		//   	Ensure that there is enough memory allocated to continue.`
		// 	);
		// }
	});
});
