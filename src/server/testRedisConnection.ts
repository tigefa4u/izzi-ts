import Cache from "cache";

async function boot() {
	await Cache.get("").then(() => console.log("Redis connected successfully."))
		.catch(err => console.log("Redis connection error: ", err));

	process.exit(1);
}
boot();