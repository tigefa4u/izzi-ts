import { ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { DzFuncProps } from "@customTypes/darkZone";
import { DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { ComputedDzReturnType } from "@customTypes/enchantment";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { getDarkZoneProfile, updateRawDzProfile } from "api/controllers/DarkZoneController";
import { getDzInvById, updateDzInv } from "api/controllers/DarkZoneInventoryController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import { XP_PER_FRAGMENT } from "helpers/constants/darkZone";
import { getXpGainFromFragments } from "helpers/enchantment";
import loggers from "loggers";
import { clearCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { clone } from "utility";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { calcLevelGain, prepareRequiredExp } from "../../enchantment/compute";

const confirmAndEnchantCard = async (
	params: ConfirmationInteractionParams<{
        cost: number;
        card: CollectionCardInfoProps;
        computed: ComputedDzReturnType;
    }>,
	options?: ConfirmationInteractionOptions
) => {
	const cost = params.extras?.cost;
	const card = params.extras?.card;
	const computed = params.extras?.computed;
	if (!cost || !card || !computed) return;
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
		const dzUser = await getDarkZoneProfile({ user_tag: params.author.id });
		if (!dzUser) return;
		if (dzUser.fragments < computed.fragmentsToConsume) {
			embed.setDescription(
				"You do not have sufficient fragments to Enchant your card. " +
                `Required __${numericWithComma(computed.fragmentsToConsume)}__ Fragments ${emoji.fragments}`
			);
			params.channel?.sendMessage(embed);
			return;
		}
		const verifyCard = await getDzInvById({
			id: card.id,
			user_tag: params.author.id
		});
		if (!verifyCard || verifyCard.length <= 0) {
			embed.setDescription("Enchantment cancelled due to missing card.");
			params.channel?.sendMessage(embed);
			return;
		}
		user.gold = user.gold - cost;
		const prevLevel = card.character_level;
		card.character_level = card.character_level + computed.levelCounter;
		await Promise.all([
			updateRawDzProfile({ user_tag: params.author.id }, {
				fragments: {
					op: "-",
					value: computed.fragmentsToConsume
				}
			}),
			updateRPGUser({ user_tag: params.author.id }, { gold: user.gold }),
			updateDzInv({
				id: card.id,
				user_tag: params.author.id 
			}, {
				exp: computed.exp,
				r_exp: computed.r_exp,
				character_level: card.character_level
			})
		]);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully Enchanted your __${titleCase(
					card.rank
				)}__ **Level ${prevLevel} ${titleCase(
					card.name
				)}** to __Level ${
					card.character_level
				}__ increasing its ability stats!`
			);

		params.channel?.sendMessage(embed);
		return;
	}
	return true;
};

export const enchantDzCard = async ({
	context,
	client,
	args,
	options,
	dzUser,
}: DzFuncProps) => {
	try {
		const { author } = options;
		const rowNum = parseInt(args.shift() || "0");
		if (rowNum <= 0 || isNaN(rowNum)) {
			context.channel?.sendMessage("Please enter a valid card #ID");
			return;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const collection = await getCardInfoByRowNumber({
			row_number: rowNum,
			isDarkZone: true,
			user_tag: author.id,
			user_id: dzUser.user_id,
		});
		const card = (collection || [])[0];
		if (!card) {
			embed.setDescription(
				"We could not find the card you were looking for in your Dark Zone inventory."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const result = await computeLevelUp(card, dzUser);
		if (!result) return;
		if (result.has_reached_max_level) {
			embed.setDescription("This card has already reached max level.");
			context.channel?.sendMessage(embed);
			return;
		}
		const cost = Math.floor((result.totalXpGain || 0) / 7);
		embed
			.setTitle(`${emoji.fire} Dark Zone Enchantment ${emoji.fire}`)
			.setDescription(
				`You are spending __${numericWithComma(cost)}__ Gold ${
					emoji.gold
				} and consuming __${numericWithComma(
					result.fragmentsToConsume || 0
				)}x__ Fragments ${emoji.fragments} to Enchant your __${titleCase(card.rank)}__ **Level ${
					card.character_level
				} ${titleCase(
					card.name
				)}**`
			)
			.setFooter({
				text: `Total Level: ${card.character_level} -> ${
					card.character_level + (result.levelCounter || 0)
				} | Total Exp Gained: ${result.totalXpGain} | Required Exp: ${
					result.reqExp || 0
				} | Total Cost: ${cost}`,
				iconURL: author.displayAvatarURL(),
			})
			.setHideConsoleButtons(true);

        
		const funcParams = {
			author,
			channel: context.channel,
			client,
			extras: {
				cost,
				computed: result,
				card,
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
					clearCooldown(author.id, "dz-enchant");
					sentMessage.deleteMessage();
				}
			}
		);

		embed.setHideConsoleButtons(true);
		if (buttons) {
			embed.setButtons(buttons);
			setCooldown(author.id, "dz-enchant", 60 * 5);
			const msg = await context.channel?.sendMessage(embed);
			if (msg) {
				sentMessage = msg;
			}
		}
		return;
	} catch (err) {
		loggers.error("enchantmentAndEvolution.enchantDzCard: ERROR", err);
		return;
	}
};

const computeLevelUp = async (
	card: CollectionCardInfoProps,
	dzUser: DarkZoneProfileProps
): Promise<ComputedDzReturnType | undefined> => {
	try {
		const currentExp = card.exp;
		const reqExpobj = await prepareRequiredExp({ card: card });
		if (reqExpobj.has_reached_max_level) {
			return { has_reached_max_level: true } as ComputedDzReturnType;
		}
		let reqExp = reqExpobj.exp;
		if (!reqExp) {
			return;
		}
		reqExp = reqExp - currentExp; // Card already has some exp
		const requiredFragments = getXpGainFromFragments(reqExp);
		loggers.info("[dz-enh] required Fragments to max level", requiredFragments);
		let fragmentsToConsume = clone(dzUser.fragments);
		if (fragmentsToConsume > requiredFragments) {
			fragmentsToConsume = requiredFragments;
		}
		const totalXpGain = Math.ceil(fragmentsToConsume * XP_PER_FRAGMENT);
		const { levelCounter, r_exp, exp } = await calcLevelGain({
			totalXpGain,
			card,
		});
		loggers.info("[dz-enh] computed fragments to consume and level gained:", {
			levelCounter,
			fragmentsToConsume,
		});
		return {
			levelCounter,
			r_exp,
			exp,
			fragmentsToConsume,
			totalXpGain,
			reqExp
		};
	} catch (err) {
		loggers.error("Dz.enchant.computeLevelUp: ERROR", err);
		return;
	}
};
