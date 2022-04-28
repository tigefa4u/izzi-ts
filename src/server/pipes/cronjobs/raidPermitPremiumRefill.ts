import "../../../module";
import { init } from ".";

async function boot() {
	await init({ is_premium: true });
	process.exit(1);
}

boot();