import "../../../module";
import { init } from ".";

async function boot() {
	await init({
		is_premium: false,
		is_mini_premium: false 
	});
	process.exit(1);
}

boot();