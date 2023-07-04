//
// Remove the character skin if it is removed manually
//

import Cache from "cache";


const clearSkinCache = async () => {
	const cid = 1091;
	const usersWithSkins = Cache.keys && await Cache.keys("*skins::*");
	await Promise.all((usersWithSkins || []).map(async (key) => {
		const skinArr = await Cache.get(key);
		if (skinArr) {
			const data = JSON.parse(skinArr);
			const idx = data.findIndex((d: any) => d.character_id === cid);
			if (idx >= 0) {
				data.splice(idx, 1);
				if (data.length > 0) {
					await Cache.set(key, JSON.stringify(data));
				} else {
					await Cache.del(key);
				}
				console.log("Skin removed");
			}
		}
	}));

	console.log("done---");
};

async function boot() {
	await clearSkinCache();
	process.exit(0); // comment and rerun if cache isnt cleared
}

if (process.env.INVOKE) {
	boot();
}
export default clearSkinCache;
