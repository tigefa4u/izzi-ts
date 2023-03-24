import { BaseProps } from "@customTypes/command";
import { updateRaid } from "api/controllers/RaidsController";
import { getWorldBossRaid } from "api/controllers/WorldBossController";
import { createEmbed } from "commons/embeds";
import { OWNER_DISCORDID } from "environment";
import { getRemainingTimer } from "helpers";
import { PublishMessageToAllGuilds } from "helpers/directMessages";
import loggers from "loggers";

export const startWB = async ({
	options,
	context,
	client
}: BaseProps) => {
	try {
		const { author } = options;
		if (author.id !== OWNER_DISCORDID) {
			return;
		}
		const raid = await getWorldBossRaid({ is_start: false });
		if (!raid) {
			context.channel?.sendMessage("A world boss raid does not exist or has already started.");
			return;
		}
		await updateRaid({ id: raid.id }, { is_start: true });
		context.channel?.sendMessage("World Boss Raid has been started! DM-ing all guilds");

		const embed = createEmbed(author, client)
			.setTitle("World Boss Challenge has Started")
			.setDescription(
				"Hello Summoners. World Boss Challenge has started!\n" +
                "Use ``<prefix> wb bt <hidebt (optional)>`` to Attack the World Boss and loot exciting Rewards.\n" +
                `**The World Boss will Expire ${getRemainingTimer(raid.stats.timestamp)}**`
			)
			.setHideConsoleButtons(true);
		
		PublishMessageToAllGuilds({
			client,
			content: embed
		});
		return;
	} catch (err) {
		loggers.error("specialCommands.worldboss.start.startWB: ERROR", err);
		return;
	}
};