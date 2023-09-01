import { UserProps } from "@customTypes/users";
import { getAllUsers, updateRPGUser } from "api/controllers/UsersController";
import connection from "db";
import { delay, generateUUID } from "helpers";
import loggers from "loggers";
import { initLoggerContext, setLoggerContext } from "loggers/context";
import "../../../module";

type U = UserProps[] | undefined;
async function premiumTimer(users: U) {
	try {
		if (!users) return;
		loggers.info("cronjobs.premiumTier.premiumTimer: resetting user premium days: users - " + users.length);
		await Promise.all(
			users.map((user) => {
				let params = {};
				const oneDay = 1000 * 60 * 60 * 24;
				const daysDiff = Math.abs(
					new Date(user.premium_since || Date.now()).valueOf() - new Date().valueOf()
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
					if (user.raid_pass < user.max_raid_pass) {
						user.raid_pass = user.raid_pass + 1;
						Object.assign(params, {
							raid_pass: user.raid_pass,
							raid_permit_refilled_at: new Date() 
						});
					}
				} else {
					params = { premium_days_left: daysLeft };
				}
				return updateRPGUser({ user_tag: user.user_tag }, params, 
					// { hydrateCache: true }
				);
			})
		);
		loggers.info("cronjobs.premiumTier.premiumTimer: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.premiumTimer: ERROR", err);
		return;
	}
}

async function miniPremiumTimer(users: U) {
	try {
		if (!users) return;
		loggers.info("cronjobs.premiumTier.miniPremiumTimer: resetting user mini premium: users - " + users.length);
		await Promise.all(
			users.map((user) => {
				let params = {};
				const oneDay = 1000 * 60 * 60 * 24;
				const daysDiff = Math.abs(
					new Date(user.mini_premium_since || Date.now()).valueOf() - new Date().valueOf()
				);
				const dayRatio = Math.round(daysDiff / oneDay);
				let daysLeft = (user.mini_premium_days || 0) - dayRatio;
				if (daysLeft <= 0) {
					daysLeft = 0;
					params = {
						mini_premium_days_left: daysLeft,
						is_mini_premium: false,
						mini_premium_days: 0,
					};
					if (user.raid_pass < user.max_raid_pass) {
						user.raid_pass = user.raid_pass + 1;
						Object.assign(params, {
							raid_pass: user.raid_pass,
							raid_permit_refilled_at: new Date() 
						});
					}
				} else {
					params = { mini_premium_days_left: daysLeft };
				}
				return updateRPGUser({ user_tag: user.user_tag }, params, 
					// { hydrateCache: true }
				);
			})
		);
		loggers.info("cronjobs.premiumTier.miniPremiumTimer: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.miniPremiumTimer: ERROR", err);
		return;
	}
}

async function resetVoteTimers(users: U) {
	try {
		// const users = await getAllUsers();
		if (!users) return;
		loggers.info("cronjobs.premiumTier.resetVoteTimers: resetting user vote timers: users - " + users.length);
		await Promise.all(
			users.map(async (user) => {
				const oneDay = 1000 * 60 * 60 * 24;
				const diff = new Date().valueOf() - new Date(user.voted_at).valueOf();
				if (diff >= oneDay) {
					return updateRPGUser({ user_tag: user.user_tag }, { vote_streak: 0, monthly_votes: 0 }, 
						// { hydrateCache: true }
					);
				}
			})
		);
		loggers.info("cronjobs.premiumTier.resetVoteTimers: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.resetVoteTimers: ERROR", err);
		return;
	}
}

async function resetUserActive(users: U) {
	try {
		// const users = await getAllUsers();
		if (!users) return;
		loggers.info("cronjobs.premiumTier.resetUserActive: resetting user active status: users - " + users.length);
		const usersToReset: string[] = [];
		await Promise.all(
			users.map(async (user) => {
				const tenDays = 1000 * 60 * 60 * 24 * 10;
				const diff = new Date().valueOf() - new Date(user.updated_at).valueOf();
				if (diff >= tenDays) {
					usersToReset.push("'" + user.user_tag + "'");
					// return updateRPGUser(
					// 	{ user_tag: user.user_tag },
					// 	{ is_active: false },
					// 	// { hydrateCache: true }
					// );
				}
				return;
			})
		);
		if (usersToReset.length > 0) {
			loggers.info("cronjobs.premiumTier.resetUserActive: resetting " +
			"user active status after computing: " + usersToReset.length);
			await connection.raw(`update users set is_active = false where user_tag in (${usersToReset.join(",")})`);
		}
		loggers.info("cronjobs.premiumTier.resetUserActive: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.resetUserActive: ERROR", err);
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
			const users = await getAllUsers();
			const premiumUsers = users?.filter((u) => u.is_premium);
			const miniPremiumUsers = users?.filter((u) => u.is_mini_premium);
			const voteStreakUsers = users?.filter((u) => u.vote_streak > 0);
			await Promise.all([
				resetVoteTimers(voteStreakUsers),
				premiumTimer(premiumUsers),
				miniPremiumTimer(miniPremiumUsers),
				resetUserActive(users)
			]);
			loggers.info("pipes.cronjobs.premiumTier.boot: completed...");
		} catch (err) {
			loggers.error("pipes.cronjobs.premiumTier.boot: ERROR", err);
		} finally {
			loggers.info("pipes.cronjobs.premiumTier.boot: completed all jobs...");
			await delay(5000);
			process.exit(1);
		}
	});
}

boot();