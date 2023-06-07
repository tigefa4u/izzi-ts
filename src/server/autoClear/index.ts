import Cache from "cache";

async function flushBattleCooldowns() {
	const allKeys: string[] = [];
	await Promise.all(
		[
			"*event-battle*",
			"*raid-battle*",
			"*mana-battle*",
			"*dungeon-battle*",
			"*floors::ch-*",
			// "*zone::*",
			// "*stage::*",
			"*in-battle*",
		].map(async (key) => {
			const keys = Cache.keys && (await Cache.keys(key));
			return keys || "";
		})
	).then((res) => allKeys.push(...res.flat()));
	await Promise.all(allKeys.map(async (key) => await Cache.del(key)));
	console.log("done--", allKeys);
}

async function boot() {
	await flushBattleCooldowns();
	process.exit(0); // comment and rerun if cache isnt cleared
}

if (process.env.INVOKE) {
	boot();
}
export default flushBattleCooldowns;
