import { OverallStatsProps } from "@customTypes";
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
import loggers from "loggers";
import { titleCase } from "title-case";

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
		const infoDataByRow = await getCardInfoByRowNumber({
			row_number: id,
			user_id: user.id,
			user_tag: author.id
		});
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

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collection.info.getCardInfo(): something went wrong",
			err
		);
		return;
	}
};
