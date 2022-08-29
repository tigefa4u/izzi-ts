import Cache from "cache";
import { delay } from "helpers";
import loggers from "loggers";
import { createRaidBoss } from "modules/commands/rpg/raids/actions/spawn";
import { computeRank } from "modules/commands/rpg/raids/computeBoss";
import "../../../module";

// {
// 	1: {
// 		"level": 69,
// 		"votes": 0,
// 		"energy": 25,
// 		"user_id": 1,
// 		"user_tag": "266457718942990337",
// 		"username": "HoaX",
// 		"is_leader": true,
// 		"timestamp": 1659861429542,
// 		"total_attack": 0,
// 		"total_damage": 0,
// 		"total_energy": 25
// 	}
// }

// This is triggered every 5mins
const spawnRaids = async () => {
	try {
		const raidsDisabled = await Cache.get("disable-raids");
		let isEvent = false;
		if (raidsDisabled) {
			isEvent = true;
		}
		const eventsDisabled = await Cache.get("disable-events");
		if (eventsDisabled) {
			isEvent = false;
		}
		if (eventsDisabled && raidsDisabled) {
			return;
		}
		// const raids = await getAllRaids({ is_start: false });
		// if (raids && raids.length > 40) return;
		return await Promise.all([ "e", "m", "h", "i" ].map(async (difficulty) => {
			const computedBoss = computeRank(difficulty, isEvent);
			if (!computedBoss) return;
			await createRaidBoss({
				isPrivate: false,
				isEvent,
				computedBoss,
				lobby: {}
			});
		}));
	} catch (err) {
		loggers.error("cronjobs.hourlyTimers.spawnRaids(): something went wrong", err);
		return;
	}
};

async function boot() {
	await spawnRaids();
	process.exit(1);
}

boot();