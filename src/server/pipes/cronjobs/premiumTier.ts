import { getAllUsers, updateRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import "../../../module";

async function premiumTimer() {
	try {
		const users = await getAllUsers({ is_premium: true });
		if (!users) return;
		loggers.info("cronjobs.premiumTier.premiumTimer: resetting user premium days: users - " + users.length);
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
		loggers.info("cronjobs.premiumTier.premiumTimer: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.premiumTimer: ERROR", err);
		return;
	}
}

async function miniPremiumTimer() {
	try {
		const users = await getAllUsers({ is_mini_premium: true });
		if (!users) return;
		loggers.info("cronjobs.premiumTier.miniPremiumTimer: resetting user mini premium: users - " + users.length);
		await Promise.all(
			users.map((user) => {
				let params = {};
				const oneDay = 1000 * 60 * 60 * 24;
				const daysDiff = Math.abs(
					new Date(user.mini_premium_since || "").valueOf() - new Date().valueOf()
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
				} else {
					params = { mini_premium_days_left: daysLeft };
				}
				return updateRPGUser({ user_tag: user.user_tag }, params);
			})
		);
		loggers.info("cronjobs.premiumTier.miniPremiumTimer: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.miniPremiumTimer: ERROR", err);
		return;
	}
}

async function resetVoteTimers() {
	try {
		const users = await getAllUsers();
		if (!users) return;
		loggers.info("cronjobs.premiumTier.resetVoteTimers: resetting user vote timers: users - " + users.length);
		await Promise.all(
			users.map(async (user) => {
				const oneDay = 1000 * 60 * 60 * 24;
				const diff = new Date().valueOf() - new Date(user.voted_at).valueOf();
				if (diff >= oneDay) {
					return updateRPGUser({ user_tag: user.user_tag }, { vote_streak: 0 });
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

async function resetUserActive() {
	try {
		const users = await getAllUsers();
		if (!users) return;
		loggers.info("cronjobs.premiumTier.resetUserActive: resetting user active status: users - " + users.length);
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
		loggers.info("cronjobs.premiumTier.resetUserActive: completed...");
		return;
	} catch (err) {
		loggers.error("cronjobs.premiumTier.resetUserActive: ERROR", err);
		return;
	}
}

async function boot() {
	await Promise.all([
		resetVoteTimers(),
		premiumTimer(),
		miniPremiumTimer(),
		resetUserActive()
	]);
	process.exit(1);
}

boot();