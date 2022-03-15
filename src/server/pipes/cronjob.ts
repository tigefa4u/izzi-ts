import { deleteRaid, getAllRaids } from "api/controllers/RaidsController";
import { getAllUsers, updateRPGUser } from "api/controllers/UsersController";
import connection from "db";
import { refillEnergy } from "helpers/raid";
import loggers from "loggers";
import autoKick from "./autoKick";
import { DMUserViaApi } from "./directMessage";

const knex = connection;

async function init(params: { is_premium: boolean }) {
	await knex.raw(
		`update users set raid_pass = raid_pass + 1, raid_permit_refilled_at = now() 
        where is_banned = false and is_premium = ${params.is_premium} and raid_pass < max_raid_pass`
	);
}

async function resetUserActive() {
	try {
		const users = await getAllUsers();
		if (!users) return;
		await Promise.all(
			users.map(async (user) => {
				const dt = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
				if (dt < new Date(user.updated_at).valueOf()) {
					return updateRPGUser(
						{ user_tag: user.user_tag },
						{ is_active: false }
					);
				}
				return;
			})
		);
		return;
	} catch (err) {
		loggers.error("cronjob.resetUserActive(): something went wrong", err);
		return;
	}
}

async function refillMana() {
	await knex.raw(
		"update users set mana = mana + 2, mana_refilled_at = now() " +
		"where is_banned = false and is_premium = false and mana < max_mana"
	);
	await knex.raw(
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
		loggers.error("cronjob.refillRaidEnergy(): something went wrong", err);
		return;
	}
}

async function premiumTimer() {
	try {
		const users = await getAllUsers({ is_premium: true });
		if (!users) return;
		await Promise.all(
			users.map((user) => {
				let params = {};
				const oneDay = 1000 * 60 * 60 * 24;
				const daysDiff = Math.abs(
					new Date(user.premium_since).valueOf() - new Date().valueOf()
				);
				const dayRatio = Math.round(daysDiff / oneDay);
				let daysLeft = user.premium_days - dayRatio;
				if (daysLeft <= 0) {
					daysLeft = 0;
					params = {
						premium_days_left: daysLeft,
						is_premium: false,
						premium_days: 0,
					};
				} else {
					params = { premium_days_left: daysLeft };
				}
				return updateRPGUser({ user_tag: user.user_tag }, params);
			})
		);
		return;
	} catch (err) {
		loggers.error("cronjob.premiumTimer(): something went wrong", err);
		return;
	}
}

async function resetVoteTimers() {
	try {
		const users = await getAllUsers();
		if (!users) return;
		await Promise.all(
			users.map(async (user) => {
				const oneDay = 1000 * 60 * 60 * 24;
				const diff = new Date().valueOf() - new Date(user.voted_at).valueOf();
				if (diff >= oneDay) {
					return updateRPGUser({ user_tag: user.user_tag }, { vote_streak: 0 });
				}
			})
		);
		return;
	} catch (err) {
		loggers.error("cronjob.resetVoteTimers(): something went wrong", err);
		return;
	}
}

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
		loggers.error("cronjob.raidTimers(): something went wrong", err);
		return;
	}
}

setInterval(() => {
	resetUserActive();
}, 1000 * 60 * 60 * 24);

setInterval(() => {
	raidTimers();
}, 1000 * 60 * 10);

setInterval(() => {
	init({ is_premium: false });
}, 1000 * 60 * 60 * 3);

setInterval(() => {
	init({ is_premium: true });
}, 9e6);

setInterval(() => {
	refillMana();
}, 1000 * 60 * 4);

setInterval(() => {
	refillRaidEnergy();
}, 1000 * 60 * 3);

setInterval(() => {
	premiumTimer();
	resetVoteTimers();
}, 1000 * 60 * 60 * 24);

setInterval(() => {
	autoKick();
}, 1000 * 60 * 5);

console.log("cronjob has started");
