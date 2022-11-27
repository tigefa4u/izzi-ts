import "../../../module";
import { init } from ".";
import loggers from "loggers";

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
		process.exit(1);
	}
}

boot();