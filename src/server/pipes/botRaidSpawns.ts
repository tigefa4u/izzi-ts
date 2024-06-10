import loggers from "loggers";
import { schedule } from "node-cron";
import { spawnRaids } from "./cronjobs/hourlyTimers";

schedule("*/5 * * * *", async (now) => {
	try {
		loggers.info("pipes.botRaidSpawns: job started", now.toLocaleString());
		await spawnRaids();
		loggers.info("pipes.botRaidSpawns: job completed...");
	} catch (err) {
		loggers.error("unable to spawn raids", err);
	}
});