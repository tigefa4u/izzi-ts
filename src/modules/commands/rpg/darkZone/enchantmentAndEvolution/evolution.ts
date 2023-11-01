import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { DzFuncProps } from "@customTypes/darkZone";
import { PLProps } from "@customTypes/powerLevel";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { getDarkZoneProfile, updateRawDzProfile } from "api/controllers/DarkZoneController";
import { getDzInvById, updateDzInv } from "api/controllers/DarkZoneInventoryController";
import { getPowerLevelByRankId } from "api/controllers/PowerLevelController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, STARTER_CARD_EXP, STARTER_CARD_LEVEL, STARTER_CARD_R_EXP 
} from "helpers/constants/constants";
import { DZ_FRAGMENT_COST_PER_EVO } from "helpers/constants/darkZone";
import { ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { clearCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";

const confirmAndEvoCard = async (
	params: ConfirmationInteractionParams<{
    card: CollectionCardInfoProps;
    newRank: PLProps;
  }>,
	options?: ConfirmationInteractionOptions
) => {
	const card = params.extras?.card;
	const newRank = params.extras?.newRank;
	if (!card || !newRank) return;
	if (options?.isConfirm) {
		const dzUser = await getDarkZoneProfile({ user_tag: params.author.id });
		if (!dzUser) return;
		const embed = createEmbed(params.author, params.client).setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		if (dzUser.fragments < DZ_FRAGMENT_COST_PER_EVO) {
			embed.setDescription("You do not have sufficient Fragments to evolve your card. " + 
            `Required: **[${numericWithComma(dzUser.fragments)} / ${numericWithComma(DZ_FRAGMENT_COST_PER_EVO)}]**`);
			params.channel?.sendMessage(embed);
			return;
		}
		const verifyCard = await getDzInvById({
			id: card.id,
			user_tag: params.author.id
		});
		if (!verifyCard || verifyCard.length <= 0) {
			embed.setDescription("Evolution cancelled due to missing card.");
			params.channel?.sendMessage(embed);
			return;
		}
		await Promise.all([
			updateRawDzProfile({ user_tag: params.author.id }, {
				fragments: {
					op: "-",
					value: DZ_FRAGMENT_COST_PER_EVO
				}
			}),
			updateDzInv({
				id: card.id,
				user_tag: params.author.id 
			}, {
				rank: newRank.rank,
				rank_id: newRank.rank_id,
				character_level: STARTER_CARD_LEVEL,
				exp: STARTER_CARD_EXP,
				r_exp: STARTER_CARD_R_EXP
			})
		]);
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully Evolved your __${titleCase(card.rank)}__ ` +
                `**${titleCase(card.name)}** to **Level ${STARTER_CARD_LEVEL}** ` +
                `__${titleCase(newRank.rank)}__`
			);
		params.channel?.sendMessage(embed);
		return;
	}
	return true;
};

export const evoDzCard = async ({
	context,
	client,
	args,
	options,
	dzUser,
}: DzFuncProps) => {
	try {
		const { author } = options;
		const rowNum = parseInt(args.shift() || "0");
		if (rowNum <= 0 || isNaN(rowNum)) return;
		const collection = await getCardInfoByRowNumber({
			row_number: rowNum,
			isDarkZone: true,
			user_id: dzUser.user_id,
			user_tag: dzUser.user_tag,
		});
		const cardToEvo = (collection || [])[0];
		let embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		if (!cardToEvo) {
			embed.setDescription(
				"We could not find the card you were looking for in your Dark Zone inventory."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (cardToEvo.rank_id >= ranksMeta.mythical.rank_id) {
			embed.setDescription("Your card has already reached its max evolution");
			context.channel?.sendMessage(embed);
			return;
		}
		if (
			cardToEvo.character_level < (ranksMeta[cardToEvo.rank].max_level || 70)
		) {
			embed.setDescription(
				`Your card must be **Level ${
					ranksMeta[cardToEvo.rank].max_level || 70
				}** to be able to evolve.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (dzUser.fragments < DZ_FRAGMENT_COST_PER_EVO) {
			embed.setDescription(
				"You do not have sufficient Fragments to evolve your card. " +
          `Required **[${numericWithComma(
          	dzUser.fragments
          )} / ${numericWithComma(DZ_FRAGMENT_COST_PER_EVO)}]**`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const nextRank = cardToEvo.rank_id + 1;
		const newRank = await getPowerLevelByRankId({ rank_id: nextRank });
		if (!newRank) return;
		embed = createConfirmationEmbed(author, client)
			.setHideConsoleButtons(true)
			.setDescription("Are you sure you want to consume " +
            `__${numericWithComma(DZ_FRAGMENT_COST_PER_EVO)}__ Fragments ${emoji.fragments} ` +
            `and Evolve your __${titleCase(cardToEvo.rank)}__ **${titleCase(cardToEvo.name)}** ` +
            `to __${titleCase(newRank.rank)}__?`);

		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				client,
				author,
				extras: {
					card: cardToEvo,
					newRank 
				}
			},
			confirmAndEvoCard,
			(_data, opts) => {
				if (opts?.isDelete) {
					clearCooldown(author.id, "dz-evo");
					sentMessage?.deleteMessage();
				}
			}
		);
		if (!buttons) return;
		embed.setButtons(buttons);
		setCooldown(author.id, "dz-evo", 60);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("");
		return;
	}
};
