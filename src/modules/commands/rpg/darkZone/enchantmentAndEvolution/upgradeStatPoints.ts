import { CharacterStatProps } from "@customTypes/characters";
import { DzFuncProps } from "@customTypes/darkZone";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { updateRawDzProfile } from "api/controllers/DarkZoneController";
import { updateDzInv } from "api/controllers/DarkZoneInventoryController";
import { createEmbed } from "commons/embeds";
import { numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import { DZ_FRAGMENT_COST_PER_STAT_POINT, DZ_MAX_STAT } from "helpers/constants/darkZone";
import loggers from "loggers";
import { titleCase } from "title-case";
import { statMap } from "../../guild/upgrades";

export const upgradeDzStatPoint = async ({
	context, client, args, options, dzUser 
}: DzFuncProps) => {
	try {
		const { author } = options;
		const rowNum = parseInt(args.shift() || "0");
		const statArg = args.shift();
		let statPoint = parseInt(args.shift() || "1");
		if (!rowNum || !statArg || !statPoint || isNaN(rowNum) || isNaN(statPoint) || rowNum <= 0) return;
		const collection = await getCardInfoByRowNumber({
			row_number: rowNum,
			user_id: dzUser.user_id,
			user_tag: dzUser.user_tag,
			isDarkZone: true
		});
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		const card = (collection || [])[0];
		if (!card) {
			embed.setDescription("We could not find the card in your Dark Zone inventory.");
			context.channel?.sendMessage(embed);
			return;
		}
		const stat = statMap[statArg] as keyof CharacterStatProps;
		if (card.stats[stat] >= DZ_MAX_STAT) {
			embed.setDescription(`You have already maxed out your **${statArg.toUpperCase()}** Stat.`);
			context.channel?.sendMessage(embed);
			return;
		}
		const requiredToMax = DZ_MAX_STAT - card.stats[stat];
		if (statPoint > requiredToMax) {
			statPoint = requiredToMax;
		}
		const cost = statPoint * DZ_FRAGMENT_COST_PER_STAT_POINT;
		if (dzUser.fragments < cost) {
			embed.setDescription("You do not have sufficient Fragments. " + 
            `Required **[${numericWithComma(dzUser.fragments)} / ${numericWithComma(cost)}]**`);
			context.channel?.sendMessage(embed);
			return;
		}
		card.stats[stat] = card.stats[stat] + statPoint;
		await Promise.all([
			updateRawDzProfile({ user_tag: author.id }, {
				fragments: {
					op: "-",
					value: cost
				}
			}),
			updateDzInv({
				id: card.id,
				user_tag: author.id 
			}, { stats: card.stats })
		]);
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`You have successfully increased the **${statArg.toUpperCase()}** ` +
            `base stat of your **Level ${card.character_level}** ` +
            `__${titleCase(card.rank)}__ **${titleCase(card.metadata?.nickname || card.name)}** ` +
            `by __+${statPoint}__ Points`);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("upgradeDzStatPoint: ERROR", err);
		return;
	}
};