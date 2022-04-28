import { deleteRaid, getAllRaids } from "api/controllers/RaidsController";
import loggers from "loggers";
import { DMUserViaApi } from "../directMessage";
import "../../../module";
import autoKick from "../autoKick";

async function raidTimers() {
	try {
		const raids = await getAllRaids();
		if (!raids) return;
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
					return await Promise.all([
						...keys.map(async (k) => {
							const id = raid.lobby[k].user_tag;
							return await DMUserViaApi(id, {
								content: `The ${
									raid.is_event ? "Event" : "Raid"
								} Boss has fled! You can spawn another Challenge using \`\`${
									raid.is_event ? "ev" : "rd"
								} spawn\`\``,
							});
						}),
						deleteRaid({ id: raid.id }),
					]);
				}
			})
		);
		return;
	} catch (err) {
		loggers.error("cronjobs.oneMinuteTimers.raidTimers(): something went wrong", err);
		return;
	}
}

async function boot() {
	await autoKick();
	await raidTimers();
	process.exit(1);
}

boot();