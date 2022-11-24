import "../../../module";
import { init } from ".";
import loggers from "loggers";

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
		process.exit(1);
	}
}

boot();