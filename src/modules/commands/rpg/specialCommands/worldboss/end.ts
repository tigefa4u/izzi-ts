import { BaseProps } from "@customTypes/command";
import { deleteRaid } from "api/controllers/RaidsController";
import { finishWorldBossEvent, getWorldBossRaid } from "api/controllers/WorldBossController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { PublishMessageToAllGuilds } from "helpers/directMessages";
import loggers from "loggers";

export const finishWB = async ({ context, client, args, options }: BaseProps) => {
	try {
		const { author } = options;
		if (author.id !== OWNER_DISCORDID) {
			return;
		}
		const raid = await getWorldBossRaid({ is_start: true });
		if (!raid) {
			context.channel?.sendMessage("World Boss Challenge does not exist or has not started.");
			return;
		}
		loggers.info("Finishing world boss challenge...");
		const cids = raid.raid_boss.map((b) => b.character_id);
		const promises = [ deleteRaid({ id: raid.id }), finishWorldBossEvent(cids) ];
		await Promise.all(promises);

		context.channel?.sendMessage(`World Boss ID: ${raid.id} has been deleted. DM-ing all guilds`);

		const embed = createEmbed(author, client)
			.setTitle(`World Boss Expiration ${emoji.cry}`)
			.setDescription("The World Boss has not been defeated and fled! Check back later for more challenges.");

		PublishMessageToAllGuilds({
			client,
			content: embed
		});
		return;
	} catch (err) {
		loggers.error("specialCommands.worldBoss.end.finishWB: ERROR", err);
		return;
	}
};