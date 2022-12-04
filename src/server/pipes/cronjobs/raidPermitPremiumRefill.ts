import "../../../module";
import { init } from ".";
import loggers from "loggers";
import { delay } from "helpers";

async function boot() {
	try {
		loggers.info("cronjobs.raidPermitPremiumRefill.boot: started...");
		await init({
			is_premium: true,
			is_mini_premium: true 
		});
		loggers.info("cronjobs.raidPermitPremiumRefill.boot: completed...");
	} catch (err) {
		loggers.error("cronjobs.raidPermitPremiumRefill.boot: ERROR", err);
	} finally {
		loggers.info("cronjobs.raidPermitPremiumRefill.boot: completed all jobs...");
		await delay(1000);
		process.exit(1);
	}
}

boot();