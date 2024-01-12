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
		const spawnLevels: {
			[key: number]: number;
		} = {
			0: 60,
			1: 90,
			2: 120,
			3: 150,
			4: 200
		};
		// const raids = await getAllRaids({ is_start: false });
		// if (raids && raids.length > 40) return;
		return Promise.all(
			Array(5)
				.fill([ "e", "m", "h", "i" ])
				.flat()
				.map(async (difficulty, i) => {
					// spawning boss based on user level
					const computedBoss = computeRank(
						difficulty,
						isEvent,
						false,
						randomNumber(i === 0 ? 30 : spawnLevels[i - 1], spawnLevels[i])
					);
					if (!computedBoss) return;
					loggers.info(
						"cronjobs.hourlyTimers.spawnRaids: spawning raid with difficulty " +
              difficulty
					);
					const promises = [ createRaidBoss({
						isPrivate: false,
						isEvent,
						computedBoss,
						lobby: {},
					}) ];
					if (!isEvent) {
						const darkZoneBoss = computeRank(
							difficulty,
							isEvent,
							false,
							randomNumber(30, 200),
							{ isDarkZone: true }
						);
						if (!darkZoneBoss) return;
						loggers.info("cronjobs.hourleyTimers.spawnRaid: spawning dark zone raid: ", difficulty);
						promises.push(createRaidBoss({
							isPrivate: false,
							isEvent,
							computedBoss: darkZoneBoss,
							lobby: {},
							darkZoneSpawn: true
						}));
					}

					await Promise.all(promises);
				})
		);
	} catch (err) {
		loggers.error("cronjobs.hourlyTimers.spawnRaids: ERROR", err);
		return;
	}
};

function boot() {
	initLoggerContext(async () => {
		try {
			setLoggerContext({
				requestId: generateUUID(10),
				userTag: "cronjob",
			});
			await spawnRaids();
			loggers.info("cronjobs.hourlyTimers.spawnRaids: job completed...");
		} catch (err) {
			loggers.error("cronjobs.hourlyTimers.spawnRaids: ERROR", err);
		} finally {
			await delay(1000);
			process.exit(1);
		}
	});
}

boot();
