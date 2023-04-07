import { AuthorProps } from "@customTypes";
import { CommandProps } from "@customTypes/command";
import { getEodTimeRemainingInSec } from "helpers";
import loggers from "loggers";
import GA4 from "loggers/googleAnalytics";
import { getCooldown, setCooldown } from "modules/cooldowns";

export const logCommand = (author: AuthorProps, command: CommandProps, args: string[]) => {
	try {
		loggers.info(
			`command ${command.name} used by ${author.username} (${author.id}) ` +
            `-> bot: ${author.bot}, discriminator: ${author.discriminator} -> with arguments: ${args.join(", ")}`
		);

		logCommandUsage(command.name, author.id, author.username);
		logDailyActive(author.id, author.username);
	} catch (err) {
		loggers.error("message.logCommand: Unable to log command, ERROR", err);
	}
	return;
};

const logCommandUsage = (command: string, userId: string, username: string) => {
	try {
		GA4.customEvent("command_usage", {
			category: "commands",
			action: command,
			label: `${userId}_${username}`
		});
	} catch (err) {
		console.log(err);
	}
	return;
};

export const logDailyActive = async (userId: string, username: string) => {
	try {
		const cd = await getCooldown(userId, "user-activity");
		if (!cd) {
			GA4.trackPlayerActivity({
				user_id: userId,
				username
			});
			setCooldown(userId, "user-activity", getEodTimeRemainingInSec());
		}
		return;
	} catch (err) {
		loggers.error("logDailyActive: Failed", err);
		return;
	}
};
