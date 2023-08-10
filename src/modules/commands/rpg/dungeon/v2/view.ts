import { BaseProps } from "@customTypes/command";
import { DungeonBanProps } from "@customTypes/dungeon";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getDGTeam } from "api/controllers/DungeonsController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import { prepareTotalOverallStats } from "helpers/teams";
import loggers from "loggers";
import { titleCase } from "title-case";
import {
	prepareDefaultTeamDescription,
	prepareTeamDescription,
} from "../../team";

export const viewDGTeam = async ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const [ dgTeam, user ] = await Promise.all([
			getDGTeam(author.id),
			getRPGUser({ user_tag: author.id }, { cached: true }),
		]);
		if (!dgTeam) {
			embed.setDescription(
				`Summoner **${author.username}**, You do not have a DG Team. ` +
          "You can create one using ``iz dg create <name>``"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (!user) return;
		const ids = dgTeam.team.metadata
			.map((m) => Number((m || {}).collection_id))
			.filter(Boolean);

		let desc = prepareDefaultTeamDescription();

		if (ids.length > 0) {
			const collections = await getCollectionById({
				user_id: user.id,
				ids,
			});
			if (!collections) {
				context.channel?.sendMessage(
					`Could not view DG Team **__${dgTeam.team.name}__**, ` +
            "please reset your team using ``iz tm reset``."
				);
				return;
			}
			const totalOverallStats = await prepareTotalOverallStats({
				collections,
				isBattle: false,
			});
			if (totalOverallStats) {
				const teamPosition = dgTeam.team.metadata
					.filter(Boolean)
					.sort((a) => a.position);
				desc = prepareTeamDescription(totalOverallStats, teamPosition, true);
			}
		}

		embed
			.setTitle(`DG Team View ${dgTeam.team.name}`)
			.setDescription(desc)
			.setFooter({
				iconURL: author.displayAvatarURL(),
				text: "Assign a card using 'iz dg set <#ID> <position #>'",
			});

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.view.viewDGTeam: ERROR", err);
		return;
	}
};
