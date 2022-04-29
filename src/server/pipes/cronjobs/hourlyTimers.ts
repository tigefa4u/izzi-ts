import Cache from "cache";
import loggers from "loggers";
import { createRaidBoss } from "modules/commands/rpg/raids/actions/spawn";
import { computeRank } from "modules/commands/rpg/raids/computeBoss";
import "../../../module";

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
		return await Promise.all(Array(10).fill([ "e", "m", "h", "i" ]).map((difficultyMap) => {
			return difficultyMap.map(async (difficulty: string) => {
				const computedBoss = computeRank(difficulty, isEvent);
				if (!computedBoss) return;
				return await createRaidBoss({
					isPrivate: false,
					isEvent,
					computedBoss,
					lobby: {}
				});
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