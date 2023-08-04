import {
	AuthorProps,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { CharacterCardProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { getCharacterInfo } from "api/controllers/CharactersController";
import {
	getCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import { createMarketCard } from "api/controllers/MarketsController";
import { getUserBlacklist } from "api/controllers/UserBlacklistsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	MARKET_COMMISSION,
	MARKET_PRICE_CAP,
	MIN_MARKET_PRICE,
	OS_GLOBAL_MARKET_CHANNEL,
	ranksMeta,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { validateMarketCard } from "..";

type P = {
  client: BaseProps["client"];
  characterInfo: CharacterCardProps;
  price: number;
  author: BaseProps["options"]["author"];
  cardId: number;
};
const sendMessageInOs = async ({
	client,
	characterInfo,
	price,
	author,
	cardId,
}: P) => {
	try {
		const embed = createEmbed(author, client)
			.setTitle(`${numericWithComma(price)} Gold ${emoji.gold}`)
			.setThumbnail(
				characterInfo.metadata?.assets?.small.filepath || characterInfo.filepath
			)
			.addField(
				`${titleCase(characterInfo.name)} | Level ${
					characterInfo.character_level
				}`,
				`${titleCase(characterInfo.rank)} | ID: ${cardId}`
			)
			.setFooter({
				text: `To buy this card. Use \`\`iz mk buy ${cardId}\`\``,
				iconURL: author.displayAvatarURL(),
			})
			.setHideConsoleButtons(true)

			// To send embeds in broadcastEval it must be
			// in json format, need to serialize to send embeds accross shards.
			.toJSON();
		await client.shard?.broadcastEval(async (cl, { embed_1 }: any) => {
			const channel = await cl.channels.fetch(OS_GLOBAL_MARKET_CHANNEL);
			if (!channel || channel.type !== "GUILD_TEXT") {
				return;
			}

			channel.send({ embeds: [ embed_1 ] });
		}, { context: { embed_1: embed } });
	} catch (err) {
		loggers.error("market.shop.sell.sendMessageInOs: ERROR", err);
	}
	return;
};

async function validateAndSellCard(
	params: ConfirmationInteractionParams<{ id: number; price: number }>,
	options?: ConfirmationInteractionOptions
) {
	try {
		const user = await getRPGUser(
			{ user_tag: params.author.id },
			{ cached: true }
		);
		if (!user || !params.extras?.id) return;
		const collection = await getCollection({
			is_item: false,
			is_on_market: false,
			id: params.extras.id,
			user_id: user.id,
			is_on_cooldown: false,
		});
		if (!collection || collection.length <= 0) {
			params.channel?.sendMessage(
				"The card you are looking for either does not exist in your collections or is on cooldown :no_entry:"
			);
			return;
		}
		const cardToBeSold = collection[0];
		if (!cardToBeSold.is_tradable) {
			params.channel?.sendMessage(
				`The card you are trying to sell cannot be sold on the Global Market, or traded **(${titleCase(
					cardToBeSold.name || "No Name"
				)})**`
			);
			return;
		}
		if (cardToBeSold.rank_id <= ranksMeta["platinum"].rank_id) {
			params.channel?.sendMessage(
				`Summoner **${params.author.username}**, You cannot sell **Fodders** on the Global Market. ` +
          "Cards that are of rank **Silver, Gold, Platinum** are considered as Fodders."
			);
			return;
		}
		const marketCard = await validateMarketCard(
			cardToBeSold.id,
			params.channel,
			params.client,
			user.id,
			{ duplicateError: true }
		);
		if (marketCard) return;
		const charaInfo = await getCharacterInfo({
			ids: [ cardToBeSold.character_id ],
			rank: cardToBeSold.rank,
		});
		if (!charaInfo || charaInfo.length <= 0) {
			return;
		}
		const characterInfo = charaInfo[0];
		if (options?.isConfirm) {
			await Promise.all([
				updateCollection({ id: cardToBeSold.id }, { is_on_market: true }),
				createMarketCard({
					user_id: cardToBeSold.user_id,
					collection_id: cardToBeSold.id,
					price: params.extras?.price || 1000,
				}),
			]);
			const desc = `You have successfully posted your __${titleCase(
				cardToBeSold.rank
			)}__ **Level ${cardToBeSold.character_level} ${titleCase(
				characterInfo.name || ""
			)}** for sale on the Global Market.`;
			const embed = createEmbed()
				.setThumbnail(
					characterInfo.metadata?.assets?.small.filepath ||
            characterInfo.filepath
				)
				.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription(desc)
				.setHideConsoleButtons(true);
			params.channel?.sendMessage(embed);

			characterInfo.character_level = cardToBeSold.character_level;
			await sendMessageInOs({
				client: params.client,
				characterInfo,
				price: params.extras.price || 1000,
				author: params.author,
				cardId: cardToBeSold.id
			});
			return;
		}
		return Object.assign(
			{},
			{
				...characterInfo,
				character_level: cardToBeSold.character_level,
			}
		);
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.market.shop.sell.validateAndSellCard: ERROR",
			err
		);
		return;
	}
}

export const sellCard = async ({
	context,
	client,
	author,
	args,
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
	try {
		const cooldownCommand = "sell-card";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
		const userBlacklisted = await getUserBlacklist({ user_tag: author.id });
		if (userBlacklisted && userBlacklisted.length > 0) {
			const blackListEmbed = createEmbed(author, client)
				.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription(
					`Summoner **${author.username}**, You have been ` +
            "blacklisted and cannot use the Global Market. Please contact support to appeal."
				);

			context.channel?.sendMessage(blackListEmbed);
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const sellingPrice = Number(args.shift());
		if (!sellingPrice || isNaN(sellingPrice)) return;
		if (sellingPrice > MARKET_PRICE_CAP) {
			context.channel?.sendMessage(
				"Please provide a valid selling price not more than " +
          `__${numericWithComma(MARKET_PRICE_CAP)}__ gold ${emoji.gold}`
			);
			return;
		} else if (sellingPrice < MIN_MARKET_PRICE) {
			context.channel?.sendMessage("Please provide a valid selling price, minimum " +
			`__${numericWithComma(MIN_MARKET_PRICE)}__ gold ${emoji.gold}`);
			return;
		}
		const params = {
			extras: {
				id,
				price: sellingPrice,
			},
			channel: context.channel,
			client,
			author,
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndSellCard,
			(data, opts) => {
				if (data) {
					const commission = Math.floor(sellingPrice * MARKET_COMMISSION);
					const totalCost = sellingPrice - commission;
					const desc = `Are you sure you want to sell your __${titleCase(
						data.rank || ""
					)}__ **Level ${data.character_level} ${titleCase(
						data.name || ""
					)}** on the Global Market? You will receive __${numericWithComma(
						totalCost
					)}__ ${emoji.gold}`;
					embed = createConfirmationEmbed(author, client)
						.setDescription(desc)
						.setThumbnail(
							data.metadata?.assets?.small.filepath ||
                client.user?.displayAvatarURL() ||
                ""
						);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.market.sell.sellCard: ERROR", err);
		return;
	}
};
