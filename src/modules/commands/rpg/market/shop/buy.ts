import {
	AuthorProps,
	ChannelProp,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { IMarketProps } from "@customTypes/market";
import { UserProps } from "@customTypes/users";
import { updateCollection } from "api/controllers/CollectionsController";
import { delFromMarket } from "api/controllers/MarketsController";
import {
	getRPGUser,
	getUser,
	updateRPGUser,
} from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { numericWithComma } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	MARKET_COMMISSION,
	MARKET_PURCHASE_LIMIT,
	QUEST_TYPES,
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import {
	clearCooldown,
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { validateMarketCard } from "..";
import { validateAndCompleteQuest } from "../../quests";

async function processPurchase(
	buyer: UserProps,
	dealer: UserProps,
	seller: UserProps,
	total: number,
	id: number
) {
	// commission
	const commission = Math.floor(total * MARKET_COMMISSION);
	dealer.gold = dealer.gold + commission;
	const cost = total - commission;

	buyer.gold = buyer.gold - total;
	seller.gold = seller.gold + cost;
	if (seller.selected_card_id === id) {
		seller.selected_card_id = null;
	}
	const promises = [
		updateRPGUser({ user_tag: dealer.user_tag }, { gold: dealer.gold }),
		updateRPGUser({ user_tag: buyer.user_tag }, { gold: buyer.gold }),
		updateRPGUser(
			{ user_tag: seller.user_tag },
			{
				gold: seller.gold,
				selected_card_id: seller.selected_card_id,
			}
		),
	];

	await Promise.all(promises);
	return cost;
}

async function notifySeller(
	buyer: UserProps,
	dealer: UserProps,
	seller: UserProps,
	marketCard: IMarketProps,
	client: Client
) {
	const [ totalCost ]: [number, void] = await Promise.all([
		processPurchase(
			buyer,
			dealer,
			seller,
			marketCard.price,
			marketCard.id
		),
		validateAndCompleteQuest({
			user_tag: seller.user_tag,
			level: seller.level,
			options: {
				client,
				channel: {} as ChannelProp,
				author: {} as AuthorProps,
				extras: {
					rank: marketCard.rank,
					price: marketCard.price
				}
			},
			isDMUser: true,
			type: QUEST_TYPES.MARKET
		})
	]);
	loggers.info(
		"Notifying seller of Market Purchase: ", {
      	seller: seller.user_tag,
      	buyer: buyer.user_tag,
      	totalCost,
      	price: marketCard.price,
      	marketId: marketCard.id,
      	collectionId: marketCard.collection_id
		}
	);

	const key = "anonymous-market-purchase::" + buyer.user_tag;
	const anonymousMarketPurchase = await Cache.get(key);
	const embed = createEmbed()
		.setTitle(DEFAULT_SUCCESS_TITLE)
		.setThumbnail(marketCard.metadata?.assets?.small.filepath || marketCard.filepath)
		.setDescription(
			`Congratulations summoner! You have sold your __${
				titleCase(marketCard.rank)
			}__ **Level ${marketCard.character_level} ${titleCase(
				marketCard.name
			)}** on the Global Market and received __${numericWithComma(totalCost)}__ Gold ${
				emoji.gold
			}!${anonymousMarketPurchase ? "" : `\nYour card was bought by: ${buyer.username} (${buyer.user_tag})`}`
		);
	DMUser(client, embed, seller.user_tag);
}

function notifyBuyer(channel: ChannelProp, marketCard: IMarketProps) {
	const embed = createEmbed()
		.setTitle(DEFAULT_SUCCESS_TITLE)
		.setThumbnail(marketCard.metadata?.assets?.small.filepath || marketCard.filepath)
		.setDescription(
			`Congratulations summoner! You have spent __${numericWithComma(marketCard.price)}__ Gold ${
				emoji.gold
			} and received __${titleCase(marketCard.rank)}__ **Level ${
				marketCard.character_level
			} ${titleCase(marketCard.name)}** from the Global Market!`
		);
	channel?.sendMessage(embed);
	return;
}

async function validateAndPurchaseCard(
	params: ConfirmationInteractionParams<{ id: number }>,
	options?: ConfirmationInteractionOptions
) {
	if (!params.extras?.id) return;
	const buyer = await getRPGUser({ user_tag: params.author.id });
	if (!buyer) return;
	const marketCard = await validateMarketCard(
		params.extras.id,
		params.channel,
		params.client,
		buyer.id,
		{
			notFoundError: true,
			cardOwnerError: true,
		}
	);
	if (!marketCard) return;
	const embed = createEmbed(params.author, params.client)
		.setTitle(DEFAULT_ERROR_TITLE);
	if (buyer.gold < marketCard.price) {
		embed.setDescription(
			"You do not have sufficient gold to purchase this card"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		if (!OWNER_DISCORDID) return;
		// 	const purchaseCooldown = `${params.author.id}-market-purchase`;
		// 	let purhchaseExceeded: any =
		//   (await Cache.get(purchaseCooldown)) || "{ \"purchased\": 0 }";
		// 	purhchaseExceeded = JSON.parse(purhchaseExceeded);

		// 	if (purhchaseExceeded.purchased >= MARKET_PURCHASE_LIMIT) {
		// 		const purchaseCD = await getCooldown(params.author.id, purchaseCooldown);
		// 		if (purchaseCD) {
		// 			params.channel?.sendMessage(
		// 				`You can purchase up to __${MARKET_PURCHASE_LIMIT}__ cards per day from the Global Market.`
		// 			);
		// 			sendCommandCDResponse(
		// 				params.channel,
		// 				purchaseCD,
		// 				params.author.id,
		// 				purchaseCooldown
		// 			);
		// 			return;
		// 		}
		// 	}
		const dealer = await getRPGUser({ user_tag: OWNER_DISCORDID });
		if (!dealer) {
			params.channel?.sendMessage("ERROR!");
			return;
		}
		const seller = await getUser({
			id: marketCard.user_id,
			is_banned: false,
		});
		if (!seller) {
			await Promise.all([ updateCollection({ id: marketCard.collection_id }, { is_on_market: false }), 
				delFromMarket({ id: marketCard.id }) ]);
			params.channel?.sendMessage(
				"The seller has either been banned or deleted their account."
			);
			return;
		}
		notifySeller(buyer, dealer, seller, marketCard, params.client);
		await updateCollection(
			{ id: marketCard.collection_id },
			{
				user_id: buyer.id,
				is_on_market: false,
				item_id: null,
				is_favorite: false,
				// is_on_cooldown: true
			}
		);
		await delFromMarket({ id: marketCard.id });
		// const dt = new Date();
		// await Cache.set("card-cd::" + marketCard.collection_id, JSON.stringify({
		// 	timestamp: dt,
		// 	cooldownEndsAt: dt.setHours(dt.getHours() + 4)
		// }));
		// Cache.expire && Cache.expire("card-cd::" + marketCard.collection_id, 60 * 60 * 4);
		notifyBuyer(params.channel, marketCard);

		//////////////////////////////////////////////
		//											//
		//		Market Purchase Limit disabled		//
		//											//
		//////////////////////////////////////////////

		// const count = purhchaseExceeded.purchased + 1;
		// if (count >= MARKET_PURCHASE_LIMIT) {
		// 	setCooldown(params.author.id, purchaseCooldown, 60 * 60 * 24);
		// }
		// Cache.set(purchaseCooldown, JSON.stringify({ purchased: count }));
		// Cache.expire && Cache.expire(purchaseCooldown, 60 * 60 * 24);
		return;
	}
	return marketCard;
}

export const purchaseCard = async ({
	context,
	client,
	args,
	author,
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
	try {
		const purchaseCooldown = `${author.id}-market-purchase`;
		let purhchaseExceeded: any =
      (await Cache.get(purchaseCooldown)) || "{ \"purchased\": 0 }";
		purhchaseExceeded = JSON.parse(purhchaseExceeded);

		if (purhchaseExceeded.purchased >= MARKET_PURCHASE_LIMIT) {
			const purchaseCD = await getCooldown(author.id, purchaseCooldown);
			if (purchaseCD) {
				context.channel?.sendMessage(
					`You can purchase up to __${MARKET_PURCHASE_LIMIT}__ cards per day from the Global Market.`
				);
				sendCommandCDResponse(
					context.channel,
					purchaseCD,
					author.id,
					purchaseCooldown
				);
				return;
			}
		}
		const cooldownCommand = "purchase-card";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const params = {
			client,
			author,
			channel: context.channel,
			extras: { id },
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndPurchaseCard,
			async (data, opts) => {
				if (data) {
					const desc = `Are you sure you want to purchase __${titleCase(data.rank)}__ **${titleCase(
						data.name
					)}** for __${numericWithComma(data.price)}__ gold ${emoji.gold}`;
					embed = createConfirmationEmbed(author, client)
						.setDescription(desc)
						.setThumbnail(data.metadata?.assets?.small.filepath || data.filepath);
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
		loggers.error(
			"modules.commands.rpg.market.shop.buy.purchaseCard: ERROR",
			err
		);
		return;
	}
};
