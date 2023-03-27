import { BaseProps } from "@customTypes/command";
import { getWorldBossRaid } from "api/controllers/WorldBossController";
import { PublishMessageToAllGuilds } from "helpers/directMessages";
import loggers from "loggers";
import { prepareWorldBossDesc } from "../../worldBoss/view";

export const sendSpawnMessage = async ({ context, client, options }: BaseProps) => {
	try {
		const { author } = options;
		const raid = await getWorldBossRaid({ is_start: true });
		if (!raid) {
			context.channel?.sendMessage("No world boss");
			return;
		}
		const embed = await prepareWorldBossDesc({
			client,
			author,
			currentRaid: raid,
		});

		embed.setDescription(
			"**Hello Summoners! A World Boss Challenge has been spawned. " +
			`Participate and Attack the World Boss to loot Exciting Rewards.**\n\n${embed.description}`
		).setHideConsoleButtons(true);
		// PublishMessageToAllGuilds({
		// 	client,
		// 	content: embed,
		// });
	} catch (err) {
		loggers.error("worldBoss.sendMessage: ERROR", err);
		return;
	}
};