import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { ComputedReturnType } from "@customTypes/enchantment";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import {
	deleteCollection,
	updateCollection,
	verifyCollectionsById,
} from "api/controllers/CollectionsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { groupByKey } from "utility";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { preComputeRequiredCards } from "./compute";

async function confirmAndEnchantCard(
	params: ConfirmationInteractionParams<{
    cost: number;
    computed: ComputedReturnType;
    cardToEnchant: CollectionCardInfoProps;
  }>,
	options?: ConfirmationInteractionOptions
) {
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
			"You do not have sufficient gold to Enchant your card."
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		const ids = computed.accumulator.map((a) => a.id);
		const collections = await verifyCollectionsById({
			user_id: user.id,
			ids: [ ...ids, cardToEnchant.id ],
		});
		if (
			!collections ||
      collections.length !== [ ...ids, cardToEnchant.id ].length
		) {
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

		user.gold = user.gold - cost;
		cardToEnchant.character_level =
      cardToEnchant.character_level + computed.levelCounter;
		cardToEnchant.r_exp = computed.r_exp;
		cardToEnchant.exp = computed.exp;
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
			deleteCollection({ ids }),
		]);

		params.channel?.sendMessage(embed);
	}
	return true;
}

export const enchantCard = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const cd = await getCooldown(author.id, "enchant");
		if (cd) {
			context.channel?.sendMessage("You can use this command again after a minute");
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const params: any = fetchParamsFromArgs(args);
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const [ card, cardsToExclude ] = await Promise.all([
			getCardInfoByRowNumber({
				user_id: user.id,
				row_number: id,
			}),
			getCardInfoByRowNumber({
				user_id: user.id,
				row_number: params.exclude || [],
			}),
		]);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!card || card.length <= 0) {
			embed.setDescription(
				"We were not able to find the card you were looking for"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const cardToEnchant = card[0];
		const exclude = [ cardToEnchant.id ];
		if (cardsToExclude && cardsToExclude.length > 0) {
			exclude.push(...cardsToExclude.map((cc) => cc.id));
		}
		const computed = await preComputeRequiredCards({
			card: cardToEnchant,
			...params,
			row_number: id,
			user_id: user.id,
			reqExp: 0,
			exclude_ids: [ ...new Set(exclude) ],
			channel: context.channel,
		});
		if (!computed) return;
		const cardsWithSameName = computed.accumulator.filter(
			(a) => a.character_id === cardToEnchant.character_id
		);
		const cardsWithDifferentName = computed.accumulator.filter(
			(a) => a.character_id !== cardToEnchant.character_id
		);
		const sameCardGroup = groupByKey(cardsWithSameName, "rank");
		const differentCardGroup = groupByKey(cardsWithDifferentName, "rank");
		const cost = Math.floor(computed.totalXpGain / 5);

		embed
			.setTitle(`${emoji.fire} Enchantment ${emoji.fire}`)
			.setDescription(
				`You are spending __${cost}__ Gold ${
					emoji.gold
				} and consuming the following cards to Enchant your __${titleCase(
					cardToEnchant.rank
				)}__ **Level ${cardToEnchant.character_level} ${titleCase(
					cardToEnchant.name
				)}**\n\n**CARDS WITH DIFFERENT NAMES: (NO EXP MULTIPLIER)**\n${Object.keys(
					differentCardGroup
				)
					.map(
						(g) =>
							`__${differentCardGroup[g].length}x__ ${titleCase(g)} card(s)`
					)
					.join(
						"\n"
					)}\n\n**CARDS WITH SAME NAMES: (__3x__ EXP MULTIPLIER)**\n${Object.keys(
					sameCardGroup
				)
					.map((g) => `__${sameCardGroup[g].length}x__ ${titleCase(g)} card(s)`)
					.join("\n")}`
			)
			.setFooter({
				text: `Total Level: ${cardToEnchant.character_level} -> ${
					cardToEnchant.character_level + computed.levelCounter
				} | Total Exp Gained: ${computed.totalXpGain} | Total Cost: ${cost}`,
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
					sentMessage.delete();
				}
			}
		);

		if (buttons) {
			embed.setButtons(buttons);
		}
		setCooldown(author.id, "enchant");
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.enchantment.enchantCard(): something went wrong",
			err
		);
		return;
	}
};
