import { deleteRaid, getAllRaids } from "api/controllers/RaidsController";
import loggers from "loggers";
import { DMUserViaApi } from "../directMessage";
import "../../../module";
import autoKick from "../autoKick";
import { delay, generateUUID, getRemainingHoursAndMinutes } from "helpers";
import { initLoggerContext, setLoggerContext } from "loggers/context";

// connect to process - chrome dev tool - remote connection
async function raidTimers() {
	try {
		const raids = await getAllRaids();
		if (!raids) return;
		loggers.info("cronjobs.oneMinuteTimers.raidTimers: cronjob invoked..");
		const raidIdsToDelete: number[] = [];
		raids.map((raid) => {
			const { remainingHours, remainingMinutes } = getRemainingHoursAndMinutes(raid.stats.timestamp);
			if (remainingMinutes <= 0 && remainingHours <= 0) {
				// const keys = Object.keys(raid.lobby).map(Number);
				raidIdsToDelete.push(raid.id);
				return;
				// return await deleteRaid({ id: raid.id });
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
		});
		if (raidIdsToDelete.length > 0) {
			await deleteRaid({ id: raidIdsToDelete });
		}
		loggers.info("cronjobs.oneMinuteTimers.raidTimers: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.oneMinuteTimers.raidTimers: ERROR", err);
		return;
	}
}

function boot() {
	initLoggerContext(async () => {
		try {
			setLoggerContext({
				trackingId: generateUUID(10),
				userTag: "cronjob"
			});
			await Promise.all([ autoKick(), raidTimers() ]);
		} catch (err) {
			loggers.error("cronjobs.oneMinuteTimers.boot: ERROR", err);
		} finally {
			loggers.info("cronjobs.oneMinuteTimers.boot: Completed all jobs...");
			await delay(1000);
			process.exit(1);
		}
	});
}

boot();