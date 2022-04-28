import { getAllUsers, updateRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import "../../../module";

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
		loggers.error("cronjobs.premiumTier.premiumTimer(): something went wrong", err);
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
		loggers.error("cronjobs.premiumTier.resetVoteTimers(): something went wrong", err);
		return;
	}
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
		loggers.error("cronjobs.premiumTier.resetUserActive(): something went wrong", err);
		return;
	}
}

async function boot() {
	await resetVoteTimers();
	await premiumTimer();
	await resetUserActive();
	process.exit(1);
}

boot();