import { AuthorProps, OverallStatsProps } from "@customTypes";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild } from "api/controllers/GuildsController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { overallStats, prepareStatsDesc } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import { CONSOLE_BUTTONS } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { evolveCard } from "../evolution";
import { upgradeCard } from "../evolution/upgradeCard";
import { getSortCache } from "../sorting/sortCache";
import { selectCard } from "./select";

function prepareInfoDescription(
	infoData: CollectionCardInfoProps,
	overAllStatData: OverallStatsProps
) {
	const statsPrep = {
		...overAllStatData,
		itemname: infoData.itemname,
		itemdescription: infoData.itemdescription,
		abilityname: infoData.abilityname,
		abilitydescription: infoData.abilitydescription,
		is_passive: infoData.is_passive,
	};
	const desc = `**LEVEL ${infoData.character_level}**\n**EXP [${
		infoData.exp
	} / ${infoData.r_exp}]**\n**Element Type:** ${infoData.type} ${emojiMap(
		infoData.type
	)}\n**RANK:** ${titleCase(infoData.rank)}\n**SOULS:** ${
		infoData.souls
	}\n${prepareStatsDesc(statsPrep, infoData.rank)}`;

	return desc;
}

const handleCardUpgrade = async ({
	user_tag, client, id, channel, author, cardId, rowId
} : CustomButtonInteractionParams & { author: AuthorProps; cardId: number; rowId?: number; }) => {
	const options = {
		context: { channel } as BaseProps["context"],
		options: { author },
		client,
		args: [ `${cardId}` ]
	};
	switch (id) {
		case CONSOLE_BUTTONS.UPGRADE_CARD_LEVEL.id: {
			upgradeCard(options);
			return;
		}
		case CONSOLE_BUTTONS.EVOLVE_CARD.id: {
			if (!rowId) return;
			options.args = [ `${rowId}` ];
			evolveCard(options);
			return;
		}
		case CONSOLE_BUTTONS.SELECT_CARD.id: {
			if (!rowId) return;
			options.args = [ `${rowId}` ];
			selectCard(options);
			return;
		}
	}
};

export const getCardInfo = async ({
	client,
	context,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || id <= 0 || isNaN(id)) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const sort = await getSortCache(author.id);
		const infoDataByRow = await getCardInfoByRowNumber({
			row_number: id,
			user_id: user.id,
			user_tag: author.id
		}, sort);
		if (!infoDataByRow) return;
		const infoData = infoDataByRow[0];
		if (!infoData || !infoData.characterInfo) return;
		const powerLevel = await getPowerLevelByRank({ rank: infoData.rank });
		if (!powerLevel) return;
		let guild;
		const guildMember = await getGuildMember({ user_id: user.id });
		if (guildMember) {
			guild = await getGuild({ id: guildMember.guild_id });
		}
		const overAllStatData = overallStats({
			stats: infoData.stats,
			character_level: infoData.character_level,
			powerLevel,
			guildStats: guild?.guild_stats
		});
		const canvas = await createSingleCanvas(infoData.characterInfo, false);
		const attachment = createAttachment(
			canvas?.createJPEGStream() || "",
			"info.jpg"
		);
		const embed = createEmbed(author, client);
		embed
			.setTitle(`[#${infoData.row_number}] ${titleCase(infoData.metadata?.nickname || infoData.name)}`)
			.setDescription(prepareInfoDescription(infoData, overAllStatData.totalStats))
			.setImage("attachment://info.jpg")
			.attachFiles([ attachment ]);

		const buttons = customButtonInteraction(
			context.channel,
			[
				{
					label: CONSOLE_BUTTONS.UPGRADE_CARD_LEVEL.label,
					params: {
						id: CONSOLE_BUTTONS.UPGRADE_CARD_LEVEL.id,
						author,
						cardId: infoData.id
					}
				},
				{
					label: CONSOLE_BUTTONS.EVOLVE_CARD.label,
					params: {
						id: CONSOLE_BUTTONS.EVOLVE_CARD.id,
						author,
						cardId: infoData.id,
						rowId: infoData.row_number
					}
				},
				{
					label: CONSOLE_BUTTONS.SELECT_CARD.label,
					params: {
						id: CONSOLE_BUTTONS.SELECT_CARD.id,
						author,
						cardId: infoData.id,
						rowId: infoData.row_number
					}
				}
			],
			author.id,
			handleCardUpgrade,
			() => {
				return;
			},
			false,
			2
		);

		if (buttons) {
			embed.setButtons(buttons);
		}
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collection.info.getCardInfo: ERROR",
			err
		);
		return;
	}
};
