import { getAllRaids } from "api/controllers/RaidsController";
import connection from "db";
import { delay, generateUUID } from "helpers";
import { DUNGEON_MAX_MANA } from "helpers/constants";
import { refillEnergy } from "helpers/raid";
import loggers from "loggers";
import { initLoggerContext, setLoggerContext } from "loggers/context";
import "../../../module";

async function refillMana() {
	loggers.info("cronjobs.fourMinuteTimers.refillMana: refilling mana");
	await Promise.all([
		connection.raw(
			"update users set mana = mana + 3, mana_refilled_at = now() " +
			"where is_banned = false and mana < max_mana and (is_premium = true " +
			"or is_mini_premium = true)"
		),
		connection.raw(
			"update users set mana = mana + 2, mana_refilled_at = now() " +
			"where is_banned = false and is_premium = false and mana < max_mana " +
			"and is_mini_premium = false"
		),
		connection.raw(
			"update users set dungeon_mana = dungeon_mana + 5 " +
			`where is_banned = false and dungeon_mana < ${DUNGEON_MAX_MANA}`
		)
	]);
	loggers.info("cronjobs.fourMinuteTimers.refillMana: completed...");
}

// need to reset is_event after the event
async function refillRaidEnergy() {
	try {
		const raids = await getAllRaids();
		loggers.info("cornjobs.fourMinuteTimers.refillRaidEnergy: started... raids: " + raids?.length);
		if (!raids) return;
		await Promise.all(
			raids.map((raid) => {
				// loggers.info("cronjobs.fourMinuteTimers.refillRaidEnergy: refilling energy for raid: " + raid.id);
				return refillEnergy(raid.id, raid.lobby);
			})
		);
		loggers.info("cronjobs.fourMinuteTimers.refillRaidEnergy: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.fourMinuteTimers.refillRaidEnergy: ERROR", err);
		return;
	}
}

function boot() {
	initLoggerContext(async () => {
		try {
			setLoggerContext({
				requestId: generateUUID(10),
				userTag: "cronjob"
			});
			await refillRaidEnergy();
			// await Promise.all([ refillMana(), refillRaidEnergy() ]);
		} catch (err) {
			loggers.error("cronjobs.fourMinuteTimers: ERROR", err);
		} finally {
			loggers.info("cronjobs.fourMinuteTimers: completed all jobs...");
			await delay(1000);
			process.exit(1);
		}
	});
}

boot();