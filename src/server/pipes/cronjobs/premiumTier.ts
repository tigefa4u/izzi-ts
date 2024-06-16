import { UserProps } from "@customTypes/users";
import { getAllUsers, updateRPGUser } from "api/controllers/UsersController";
import connection from "db";
import { delay, generateUUID } from "helpers";
import loggers from "loggers";
import { initLoggerContext, setLoggerContext } from "loggers/context";
import "../../../module";

/**
 * Optimization -----
 * instead of using `updateRpgUser` in every function
 * you can return the attributes of the user that needs to be updated
 * and update all of those users in one call.
 */

type U = UserProps[] | undefined;
async function premiumTimer(users: U) {
	try {
		if (!users) return;
		loggers.info(
			"cronjobs.premiumTier.premiumTimer: resetting user premium days: users - " +
        users.length
		);
		const result = await Promise.all(
			users.map((user) => {
				let params = {};
				const oneDay = 1000 * 60 * 60 * 24;
				const daysDiff = Math.abs(
					new Date(user.premium_since || Date.now()).valueOf() -
            new Date().valueOf()
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
							raid_permit_refilled_at: new Date(),
						});
					}
				} else {
					params = { premium_days_left: daysLeft };
				}
				return {
					user_tag: user.user_tag,
					params,
				};
			})
		);
		loggers.info("cronjobs.premiumTier.premiumTimer: completed...");
		return result;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.premiumTimer: ERROR", err);
		return;
	}
}

async function miniPremiumTimer(users: U) {
	try {
		if (!users) return;
		loggers.info(
			"cronjobs.premiumTier.miniPremiumTimer: resetting user mini premium: users - " +
        users.length
		);
		const result = await Promise.all(
			users.map((user) => {
				let params = {};
				const oneDay = 1000 * 60 * 60 * 24;
				const daysDiff = Math.abs(
					new Date(user.mini_premium_since || Date.now()).valueOf() -
            new Date().valueOf()
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
							raid_permit_refilled_at: new Date(),
						});
					}
				} else {
					params = { mini_premium_days_left: daysLeft };
				}
				return {
					user_tag: user.user_tag,
					params,
				};
			})
		);
		loggers.info("cronjobs.premiumTier.miniPremiumTimer: completed...");
		return result;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.miniPremiumTimer: ERROR", err);
		return;
	}
}

async function resetVoteTimers(users: U) {
	try {
		// const users = await getAllUsers();
		if (!users) return;
		loggers.info(
			"cronjobs.premiumTier.resetVoteTimers: resetting user vote timers: users - " +
        users.length
		);
		const result = await Promise.all(
			users.map(async (user) => {
				const oneDay = 1000 * 60 * 60 * 24;
				const diff = new Date().valueOf() - new Date(user.voted_at).valueOf();
				if (diff >= oneDay) {
					return {
						params: { vote_streak: 0 },
						user_tag: user.user_tag,
					};
				}
			})
		);
		loggers.info("cronjobs.premiumTier.resetVoteTimers: completed...");
		return result;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.resetVoteTimers: ERROR", err);
		return;
	}
}

async function resetUserActive(users: U) {
	try {
		// const users = await getAllUsers();
		if (!users) return;
		loggers.info(
			"cronjobs.premiumTier.resetUserActive: resetting user active status: users - " +
        users.length
		);
		const usersToReset: string[] = [];
		await Promise.all(
			users.map(async (user) => {
				const tenDays = 1000 * 60 * 60 * 24 * 10;
				const diff = new Date().valueOf() - new Date(user.updated_at).valueOf();
				if (diff >= tenDays) {
					usersToReset.push(user.user_tag);
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
			loggers.info(
				"cronjobs.premiumTier.resetUserActive: resetting " +
          "user active status after computing: " +
          usersToReset.length
			);
			await connection("users")
				.whereIn("user_tag", usersToReset)
				.update({ is_active: false });
		}
		loggers.info("cronjobs.premiumTier.resetUserActive: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.resetUserActive: ERROR", err);
		return;
	}
}

export async function boot() {
	initLoggerContext(async () => {
		try {
			setLoggerContext({
				requestId: generateUUID(10),
				userTag: "cronjob",
			});
			const users = await getAllUsers();
			const premiumUsers = users?.filter((u) => u.is_premium);
			const miniPremiumUsers = users?.filter((u) => u.is_mini_premium);
			const voteStreakUsers = users?.filter((u) => u.vote_streak > 0);
			const [ voteTimerData, premData, miniPremData ] = await Promise.all([
				resetVoteTimers(voteStreakUsers),
				premiumTimer(premiumUsers),
				miniPremiumTimer(miniPremiumUsers),
				// resetUserActive(users)
			]);
			const skewedArr = [
				...(voteTimerData || []),
				...(premData || []),
				...(miniPremData || []),
			].filter(Boolean) as any[];
			const dataToUpdate = skewedArr.reduce((acc, r) => {
				const idx = (acc || []).findIndex(
					(item: any) => item.user_tag === r?.user_tag
				);
				if (idx >= 0) {
					acc[idx].params = {
						...acc[idx].params,
						...r.params,
					};
				} else {
					acc.push(r);
				}
				return acc;
			}, []);
			loggers.info(
				"pipes.cronjobs.premiumTier.boot: updating x users -> ",
				dataToUpdate.length
			);
			if (dataToUpdate.length > 0) {
				await Promise.all(
					dataToUpdate.map((item: any) =>
						updateRPGUser({ user_tag: item.user_tag }, item.params)
					)
				);
			}
			loggers.info("updated x users:", dataToUpdate.length);
			loggers.info("pipes.cronjobs.premiumTier.boot: completed...");
		} catch (err) {
			loggers.error("pipes.cronjobs.premiumTier.boot: ERROR", err);
		} finally {
			loggers.info("pipes.cronjobs.premiumTier.boot: completed all jobs...");
			// await delay(5000);
			// process.exit(1);
		}
	});
}

// boot();
