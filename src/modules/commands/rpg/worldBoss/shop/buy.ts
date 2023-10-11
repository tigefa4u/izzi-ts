import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getRPGUser } from "api/controllers/UsersController";
import { getWorldBossByCardId } from "api/controllers/WorldBossController";
import { startTransaction } from "api/models/Users";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
	WORLD_BOSS_MARKET_CARD_RANK,
	WORLD_BOSS_MARKET_CARD_RANK_ID,
} from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";

const validateAndCompletePurchase = async (
	params: ConfirmationInteractionParams<{ id: number }>,
	options?: ConfirmationInteractionOptions
) => {
	const { author, channel, client } = params;
	const id = params.extras?.id;
	if (!id) return;
	const [ result, user ] = await Promise.all([
		getWorldBossByCardId({ id: Number(id) }),
		getRPGUser({ user_tag: author.id }),
	]);
	const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
	if (!result || result.length <= 0 || !user) {
		embed.setDescription("The World Boss Card either does not exist or has already expired.");
		channel?.sendMessage(embed);
		return;
	}
	const card = result[0];
	const shardCost = card.shard_cost;
	if (!shardCost || shardCost <= 0) {
		embed.setDescription("Unable to purchase card, please contact support.");
		channel?.sendMessage(embed);
		return;
	}
	if (user.shards < shardCost) {
		embed.setDescription(
			"You do not have sufficient shards to " +
        `purchase this card. **__[${user.shards} / ${shardCost}]__**`
		);
		channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		await startTransaction(async (trx) => {
			try {
				const updatedObj = await trx("users")
					.where({ user_tag: user.user_tag })
					.update({ shards: trx.raw(`shards - ${shardCost}`) })
					.returning("*")
					.then((res) => res[0]);

				if (!updatedObj) {
					throw new Error("Unable to update user object");
				}

				await trx("collections").insert({
					user_id: user.id,
					r_exp: STARTER_CARD_R_EXP,
					character_level: STARTER_CARD_LEVEL,
					exp: STARTER_CARD_EXP,
					rank: WORLD_BOSS_MARKET_CARD_RANK,
					rank_id: WORLD_BOSS_MARKET_CARD_RANK_ID,
					is_on_market: false,
					is_item: false,
					character_id: card.character_id,
				});
				embed
					.setTitle("Purchase Successful " + emoji.celebration)
					.setDescription(
						`Summoner **${author.username}**, You ` +
              `have successfuly spent __${shardCost}__ Shards ${emoji.shard} and ` +
              `received **Level ${STARTER_CARD_LEVEL}** __` +
              `${titleCase(WORLD_BOSS_MARKET_CARD_RANK)}__ **${titleCase(
              	card.name
              )}** ` +
              "from the World Boss Market."
					);

				channel?.sendMessage(embed);
				return;
			} catch (err) {
				embed.setDescription(
					"You do not have sufficient shards to purchase this card."
				);
				channel?.sendMessage(embed);
				return;
			}
		});
		return;
	}
	return card;
};

export const buyWorldBossCard = async ({
	context,
	options,
	args,
	client,
}: BaseProps) => {
	try {
		const id = args.shift();
		if (!id) return;
		let embed = createEmbed(options.author, client)
			.setTitle("Confirmation")
			.setHideConsoleButtons(true);
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			options.author.id,
			{
				channel: context.channel,
				client,
				author: options.author,
				extras: { id: Number(id) },
			},
			validateAndCompletePurchase,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(options.author, client)
						.setDescription(
							`Summoner **${options.author.username}**, Are you sure you want to purchase ` +
                `**Level ${STARTER_CARD_LEVEL}** __${titleCase(
                	WORLD_BOSS_MARKET_CARD_RANK
                )}__ ` +
                `**${titleCase(data.name)}** for __${numericWithComma(
                	data.shard_cost
                )}__ Shards ${emoji.shard}`
						)
						.setHideConsoleButtons(true);
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
				return;
			}
		);

		if (!buttons) return;
		embed.setButtons(buttons);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) sentMessage = msg;
		return;
	} catch (err) {
		loggers.error("worldboss.shop.buy.buyWorldBossCard: ERROR", err);
		return;
	}
};
