import { getAllRaids } from "api/controllers/RaidsController";
import connection from "db";
import { DUNGEON_MAX_MANA } from "helpers/constants";
import { refillEnergy } from "helpers/raid";
import loggers from "loggers";
import "../../../module";

async function refillMana() {
	await Promise.all([
		connection.raw(
			"update users set mana = mana + 3, mana_refilled_at = now() " +
			"where is_banned = false and is_premium = true and mana < max_mana " +
			"or is_mini_premium = true"
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
}

// need to reset is_event after the event
async function refillRaidEnergy() {
	try {
		const raids = await getAllRaids();
		if (!raids) return;
		return await Promise.all(
			raids.map((raid) => {
				return refillEnergy(raid.id, raid.lobby);
			})
		);
	} catch (err) {
		loggers.error("cronjobs.fourMinuteTimers.refillRaidEnergy(): something went wrong", err);
		return;
	}
}

async function boot() {
	await Promise.all([ refillMana(), refillRaidEnergy() ]);
	process.exit(1);
}

boot();