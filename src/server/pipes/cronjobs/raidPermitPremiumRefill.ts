import "../../../module";
import { init } from ".";

async function boot() {
	await Promise.all([ init({
		is_premium: true,
		is_mini_premium: false 
	}), init({
		is_premium: false,
		is_mini_premium: true 
	}) ]);
	process.exit(1);
}

boot();