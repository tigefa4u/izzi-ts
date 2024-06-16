import loggers from "loggers";
import { schedule } from "node-cron";
import { boot } from "./cronjobs/premiumTier";



schedule("0 0 * * *", async () => {
	try {
		loggers.info("starting premium cronjob");
		await boot();
	} catch (err) {
		loggers.error("Premium Cronjob failed:", err);
	}
});