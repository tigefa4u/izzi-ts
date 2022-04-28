import { getAllRaids } from "api/controllers/RaidsController";
import connection from "db";
import { refillEnergy } from "helpers/raid";
import loggers from "loggers";
import "../../../module";

async function refillMana() {
	await connection.raw(
		"update users set mana = mana + 2, mana_refilled_at = now() " +
		"where is_banned = false and is_premium = false and mana < max_mana"
	);
	await connection.raw(
		"update users set mana = mana + 3, mana_refilled_at = now() " +
		"where is_banned = false and is_premium = true and mana < max_mana"
	);
}

// need to reset is_event after the event
async function refillRaidEnergy() {
	try {
		const raids = await getAllRaids();
		if (!raids) return;
		await Promise.all(
			raids.map((raid) => {
				return refillEnergy(raid.id, raid.lobby);
			})
		);
		return;
	} catch (err) {
		loggers.error("cronjobs.fourMinuteTimers.refillRaidEnergy(): something went wrong", err);
		return;
	}
}

async function boot() {
	await refillMana();
	await refillRaidEnergy();
	process.exit(1);
}

boot();