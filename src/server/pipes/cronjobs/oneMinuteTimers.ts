import { deleteRaid, getAllRaids } from "api/controllers/RaidsController";
import loggers from "loggers";
import { DMUserViaApi } from "../directMessage";
import "../../../module";
import autoKick from "../autoKick";
import { delay } from "helpers";

// connect to process - chrome dev tool - remote connection
async function raidTimers() {
	try {
		const raids = await getAllRaids();
		if (!raids) return;
		loggers.info("cronjobs.oneMinuteTimers.raidTimers: cronjob invoked..");
		await Promise.all(
			raids.map(async (raid) => {
				const remainingTime =
          (new Date(raid.stats.timestamp).valueOf() - new Date().valueOf()) /
          1000 /
          60;
				const remainingHours = Math.floor(remainingTime / 60);
				const remainingMinutes = Math.floor(remainingTime % 60);
				if (remainingMinutes <= 0 && remainingHours <= 0) {
					const keys = Object.keys(raid.lobby).map(Number);
					return await deleteRaid({ id: raid.id });
					// for (const k of keys) {
					// 	await delay(1000);
					// 	const id = raid.lobby[k].user_tag;
					// 	await DMUserViaApi(id, {
					// 		content: `The ${
					// 			raid.is_event ? "Event" : "Raid"
					// 		} Boss has fled! You can spawn another Challenge using \`\`${
					// 			raid.is_event ? "ev" : "rd"
					// 		} spawn\`\``,
					// 	});
					// }
				}
			})
		);
		loggers.info("cronjobs.oneMinuteTimers.raidTimers: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.oneMinuteTimers.raidTimers: ERROR", err);
		return;
	}
}

async function boot() {
	try {
		await Promise.all([ autoKick(), raidTimers() ]);
	} catch (err) {
		loggers.error("cronjobs.oneMinuteTimers.boot: ERROR", err);
	} finally {
		process.exit(1);
	}
}

boot();