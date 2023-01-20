import Cache from "cache";

async function flushBattleCooldowns() {
	const allKeys: string[] = [];
	const chs = [ 301, 346, 284, 351, 314, 322, 333, 300, 
		349, 307, 312, 303, 332, 723, 355, 330, 280, 295, 288, 309, 
		327, 335, 318, 346, 619, 338, 311, 277, 299, 356, 331, 332, 322 ];
	await Promise.all(
		[
			"*event-battle*",
			"*raid-battle*",
			"*mana-battle*",
			"*dungeon-battle*",
			...chs.map((c) => `*floors::ch-${c}*`),
			"zone::1", "zone::2", "zone::3", "zone::10"
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
