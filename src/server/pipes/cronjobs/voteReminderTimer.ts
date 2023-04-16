import { getUsersWhoVoted } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { BOT_VOTE_LINK } from "environment";
import { delay } from "helpers";
import loggers from "loggers";
import { DMUserViaApi } from "../directMessage";

const sendVoteReminders = async () => {
	try {
		const users = await getUsersWhoVoted();
		const embed = createEmbed()
			.setThumbnail("https://izzi-xenex.xyz/static/image/izzilogo.jpeg")
			.setTitle(`Vote Reminder ${emoji.celebration}`)
			.setDescription(`Summoner, you can now vote for izzi again at\n${BOT_VOTE_LINK}`);
		if (users && users.length > 0) {
			loggers.info("sending vote reminders to ", users.length, "users");
			users.map((u) => DMUserViaApi(u.user_tag, { embeds: [ embed ] }));
		}
	} catch (err) {
		loggers.error("cronjobs.voteReminderTimer.sendVoteReminders: ERROR", err);
	}
	return;
};

const boot = async () => {
	try {
		loggers.info("voteReminderTimer: sending vote reminders");
		await sendVoteReminders();
	} catch (err) {
		loggers.error("voteReminderTimer: ERROR", err);
	} finally {
		await delay(1000);
		loggers.info("voteReminderTimer: all tasks completed...");
		process.exit(1);
	}
};

boot();