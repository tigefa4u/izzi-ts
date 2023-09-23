import { ConfirmationInteractionOptions, ConfirmationInteractionParams, FilterProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { ComputedReturnType, EnchantmentAccumulatorPropsV2 } from "@customTypes/enchantment";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { consumeFodders, updateCollection, verifyCollectionsById } from "api/controllers/CollectionsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, FODDER_RANKS, QUEST_TYPES } from "helpers/constants";
import loggers from "loggers";
import {
	clearCooldown,
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { validateAndCompleteQuest } from "../../quests";
import { getSortCache } from "../../sorting/sortCache";
import { preComputeRequiredCardsV2 } from "./compute";

const confirmAndEnchantCard = async (
	params: ConfirmationInteractionParams<{
        cost: number;
        computed: ComputedReturnType<EnchantmentAccumulatorPropsV2>;
        cardToEnchant: CollectionCardInfoProps;
      }>,
	options?: ConfirmationInteractionOptions
) => {
	const cost = params.extras?.cost;
	const computed = params.extras?.computed;
	const cardToEnchant = params.extras?.cardToEnchant;
	if (!cost || !computed || !cardToEnchant) return;
	const user = await getRPGUser({ user_tag: params.author.id });
	if (!user) return;
	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	if (user.gold < cost) {
		embed.setDescription(
			"You do not have sufficient gold to Enchant your card. " +
			`Required __${numericWithComma(cost)}__ Gold ${emoji.gold}`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		const verificationTimer = loggers.startTimer("verification started");
		const ids = computed.accumulator.map((a) => a.id);
		const collections = await verifyCollectionsById({
			user_id: user.id,
			ids: [ ...new Set([ ...ids, cardToEnchant.id ]) ],
		});
		const verificationFailed = computed.accumulator.filter((a) => {
			const chara = collections?.find((c) => c.id === a.id);
			return !chara || chara.card_count < a.count;
		});
		loggers.endTimer(verificationTimer);
		if (!collections || collections.length <= 0 || verificationFailed.length > 0) {
			embed.setDescription(
				"Enchantment has been cancelled due to missing cards"
			);
			params.channel?.sendMessage(embed);
			return;
		}
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully Enchanted your __${titleCase(
					cardToEnchant.rank
				)}__ **Level ${cardToEnchant.character_level} ${titleCase(
					cardToEnchant.name
				)}** to __Level ${
					computed.levelCounter + cardToEnchant.character_level
				}__ increasing its ability stats!`
			);

		params.channel?.sendMessage(embed);

		user.gold = user.gold - cost;
		cardToEnchant.character_level =
      cardToEnchant.character_level + computed.levelCounter;
		cardToEnchant.r_exp = computed.r_exp;
		cardToEnchant.exp = computed.exp;
		const updatetimer = loggers.startTimer("enchantment update timer started");
		await Promise.all([
			updateCollection(
				{ id: cardToEnchant.id },
				{
					r_exp: cardToEnchant.r_exp,
					exp: cardToEnchant.exp,
					character_level: cardToEnchant.character_level,
				}
			),
			updateRPGUser({ user_tag: user.user_tag }, { gold: user.gold }),
			consumeFodders(computed.accumulator)
		]);
		await validateAndCompleteQuest({
			type: QUEST_TYPES.CARD_LEVELING,
			level: user.level,
			user_tag: user.user_tag,
			options: {
				author: params.author,
				client: params.client,
				channel: params.channel,
				extras: {
					levelCounter: computed.levelCounter,
					maxlevel: computed.max_level,
					characterlevelAfterEnh: cardToEnchant.character_level
				}
			}
		});
		loggers.endTimer(updatetimer);
		return;
	}
	return true;
};

export const enchantCardV2 = async ({
	options,
	client,
	args,
	context,
}: BaseProps) => {
	try {
		const author = options.author;
		loggers.info("enchantment started for uid: " + author.id);
		const cd = await getCooldown(author.id, "enchant");
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, "enchant");
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const params = fetchParamsFromArgs<FilterProps>(args);
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const sort = await getSortCache(author.id);
		const rowNumTimer = loggers.startTimer(
			"enchantCardV2: starting get card by row number: " + id
		);
		const card = await getCardInfoByRowNumber(
			{
				user_id: user.id,
				row_number: id,
			},
			sort
		);
		loggers.endTimer(rowNumTimer);

		// if (params.exclude) {
		// 	cardsToExclude = await getCharacterInfo({ name: params.exclude });
		// }
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!card || card.length <= 0) {
			embed.setDescription(
				"We were not able to find the card you were looking for"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const cardToEnchant = card[0];
		if (FODDER_RANKS.includes(cardToEnchant.rank)) {
			embed.setDescription(
				"You cannot Enchant a Fodder card. To purchase more " +
                "fodders use ``iz pack`` or join a raid."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const exclude = [ cardToEnchant.id ];
		const excludeCharacters = [];

		const key = "enhlock::" + author.id;
		const result = await Cache.get(key);
		if (result) {
			const lockedCharacters = JSON.parse(result).lockcards;
			if (lockedCharacters && lockedCharacters.length > 0) {
				excludeCharacters.push(...lockedCharacters.map((l: { id: number; }) => l.id));
			}
		}

		// if (cardsToExclude && cardsToExclude.length > 0) {
		// 	excludeCharacters.push(...cardsToExclude.map((cc) => cc.id));
		// }
		const computationTimer = loggers.startTimer(
			"computation for cid: " + cardToEnchant.id
		);
		loggers.info("computation started for cid: " + cardToEnchant.id);
		loggers.info("computation started for card to enchant: ", cardToEnchant);
		const computed = await preComputeRequiredCardsV2({
			card: cardToEnchant,
			...params,
			row_number: id,
			user_id: user.id,
			reqExp: 0,
			exclude_ids: [ ...new Set(exclude) ],
			exclude_character_ids: [ ...new Set(excludeCharacters) ],
			channel: context.channel,
		});
		loggers.endTimer(computationTimer);
		if (!computed) return;
		if (computed.has_reached_max_level) {
			context.channel?.sendMessage(
				`Summoner **${author.username}** the card you are trying to Enchant is already max level!`
			);
			return;
		}
		const cardsWithSameNameCount = computed.accumulator
			.filter((a) => a.character_id === cardToEnchant.character_id)
			.reduce((acc, r) => acc + r.count, 0);
		const cardsWithDifferentNameCount = computed.accumulator
			.filter((a) => a.character_id !== cardToEnchant.character_id)
			.reduce((acc, r) => acc + r.count, 0);
		const cost = Math.floor(computed.totalXpGain / 5);

		embed
			.setTitle(`${emoji.fire} Enchantment ${emoji.fire}`)
			.setDescription(
				`You are spending __${numericWithComma(cost)}__ Gold ${
					emoji.gold
				} and consuming the following cards to Enchant your __${titleCase(cardToEnchant.rank)}__ **Level ${
					cardToEnchant.character_level
				} ${titleCase(
					cardToEnchant.name
				)}**\n\n**CARDS WITH DIFFERENT NAMES: (NO EXP MULTIPLIER)**` +
                `\n__${cardsWithDifferentNameCount}x__ Platinum cards(s)` +
                "\n\n**CARDS WITH SAME NAMES: (__3x__ EXP MULTIPLIER)**" +
                `\n__${cardsWithSameNameCount}x__ Platinum card(s)`
			)
			.setFooter({
				text: `Total Level: ${cardToEnchant.character_level} -> ${
					cardToEnchant.character_level + computed.levelCounter
				} | Total Exp Gained: ${computed.totalXpGain} | Required Exp: ${
					computed.reqExp
				} | Total Cost: ${cost}`,
				iconURL: author.displayAvatarURL(),
			});

		const funcParams = {
			author,
			channel: context.channel,
			client,
			extras: {
				cost,
				computed,
				cardToEnchant,
			},
		};

		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			funcParams,
			confirmAndEnchantCard,
			(_data, opts) => {
				if (opts?.isDelete) {
					clearCooldown(author.id, "enchant");
					sentMessage.deleteMessage();
				}
			}
		);

		embed.setHideConsoleButtons(true);
		if (buttons) {
			embed.setButtons(buttons);
			setCooldown(author.id, "enchant", 60 * 5);
			const msg = await context.channel?.sendMessage(embed);
			if (msg) {
				sentMessage = msg;
			}
		}
	} catch (err) {
		loggers.error("enchantment.v2.enchantcardv2: ERROR", err);
		return;
	}
};
