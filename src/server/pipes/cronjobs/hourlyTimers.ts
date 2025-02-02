import Cache from "cache";
import { delay, generateUUID, randomNumber } from "helpers";
import loggers from "loggers";
import { initLoggerContext, setLoggerContext } from "loggers/context";
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
export const spawnRaids = async () => {
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
		const spawnLevels: {
			[key: number]: number;
		} = {
			1: 60,
			2: 90,
			3: 120,
			4: 150,
			5: 200
		};
		// const raids = await getAllRaids({ is_start: false });
		// if (raids && raids.length > 40) return;
		let count = 0;
		const raidsToSpawn = await Promise.all(
			Array(5)
				.fill([ "e", "m", "h", "i" ])
				.flat()
				.map(async (difficulty, i) => {
					const res: any[] = [];
					const rem = i % 4;
					if (rem === 0) count += 1;
					const lowlevel = count === 1 ? 30 : spawnLevels[count - 1];
					const highlevel = spawnLevels[count];
					const randomLevel = randomNumber(lowlevel, highlevel);
					// spawning boss based on user level
					const computedBoss = computeRank(
						difficulty,
						isEvent,
						false,
						randomLevel
					);
					if (!computedBoss) return res;
					loggers.info(
						"cronjobs.hourlyTimers.spawnRaids: spawning raid with difficulty " +
					  difficulty
					);
					res.push({
						isPrivate: false,
						isEvent,
						computedBoss,
						lobby: {},
					});
					if (!isEvent) {
						const darkZoneBoss = computeRank(
							difficulty,
							isEvent,
							false,
							randomLevel,
							{ isDarkZone: true }
						);
						if (!darkZoneBoss) return res;
						loggers.info("cronjobs.hourleyTimers.spawnRaid: spawning dark zone raid: ", difficulty);
						res.push({
							isPrivate: false,
							isEvent,
							computedBoss: darkZoneBoss,
							lobby: {},
							darkZoneSpawn: true
						});
					}

					return res;
				})
		);
		await Promise.all(raidsToSpawn.flat().map((item) => createRaidBoss(item)));
	} catch (err) {
		loggers.error("cronjobs.hourlyTimers.spawnRaids: ERROR", err);
		return;
	}
};

// function boot() {
// 	initLoggerContext(async () => {
// 		try {
// 			setLoggerContext({
// 				requestId: generateUUID(10),
// 				userTag: "cronjob",
// 			});
// 			await spawnRaids();
// 			loggers.info("cronjobs.hourlyTimers.spawnRaids: job completed...");
// 		} catch (err) {
// 			loggers.error("cronjobs.hourlyTimers.spawnRaids: ERROR", err);
// 		} finally {
// 			await delay(1000);
// 			process.exit(1);
// 		}
// 	});
// }

// boot();
