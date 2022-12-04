import "../../../module";
import { init } from ".";
import loggers from "loggers";
import { delay } from "helpers";

async function boot() {
	try {
		loggers.info("cronjobs.raidPermitRefill.boot: started...");
		await init({
			is_premium: false,
			is_mini_premium: false 
		});
		loggers.info("cronjobs.raidPermitRefill.boot: completed...");
	} catch (err) {
		loggers.error("cronjobs.raidPermiRefill.boot: ERROR", err);
	} finally {
		loggers.info("cronjobs.raidPermitRefill.boot: completed all jobs...");
		await delay(1000);
		process.exit(1);
	}
}

boot();