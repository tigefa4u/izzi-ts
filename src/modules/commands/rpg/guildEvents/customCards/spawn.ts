import { BaseProps } from "@customTypes/command";
import { getRandomCustomCard } from "api/controllers/CustomServerCardsController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { IZZI_WEBSITE } from "environment";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";
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
		const cmd = "raid-customspawn";
		const [ cd, user ] = await Promise.all([
			getCooldown(author.id, cmd),
			getRPGUser({ user_tag: author.id })
		]);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, cmd);
			return;
		}
		if (!user) return;
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
		await spawnRaid({
			client,
			context,
			options,
			args,
			isEvent: false,
			customSpawn: true,
			external_character_ids: characters.map((c) => c.character_id),
			customSpawnParams: { is_random: false }
		});
		await setCooldown(
			author.id,
			cmd,
			user.is_premium || user.is_mini_premium ? 60 * 60 * 4 : 60 * 60 * 5
		);
		return;
	} catch (err) {
		loggers.error("guildEvents.customCards.spawnCustomServerCardRaid: ERROR", err);
		return;
	}
};