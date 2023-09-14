import { BaseProps } from "@customTypes/command";
import { getRandomCustomCard } from "api/controllers/CustomServerCardsController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { IZZI_WEBSITE } from "environment";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import loggers from "loggers";
import { spawnRaid } from "../../raids/actions/spawn";

export const spawnCustomServerCardRaid = async ({ client, context, options, args }: BaseProps) => {
	try {
		const { author } = options;
		if (!context.guild?.id) return;
		const disableRaids = await Cache.get("disable-raids");
		if (disableRaids) {
			context.channel?.sendMessage(
				"Command disabled, There could be an on going event. Use ``iz help event`` for more info"
			);
			return;
		}
		const characters = await getRandomCustomCard(context.guild.id);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!characters || characters.length <= 0) {
			embed.setDescription(`Summoner **${author.username}**, There are no custom cards on this server. ` +
            `To submit custom cards visit: ${IZZI_WEBSITE}/@me/customcard.`)
				.setHideConsoleButtons(true);

			context.channel?.sendMessage(embed);
			return;
		}
		loggers.info("spawnCustomServerCardRaid: spawning character: ", characters);
		spawnRaid({
			client,
			context,
			options,
			args,
			isEvent: false,
			customSpawn: true,
			external_character_ids: characters.map((c) => c.character_id),
			customSpawnParams: { is_random: false }
		});
		return;
	} catch (err) {
		loggers.error("guildEvents.customCards.spawnCustomServerCardRaid: ERROR", err);
		return;
	}
};