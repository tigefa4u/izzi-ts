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
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	MARKET_COMMISSION,
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { validateMarketCard } from "..";

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
	const totalCost = await processPurchase(
		buyer,
		dealer,
		seller,
		marketCard.price,
		marketCard.id
	);
	loggers.info(
		"Notifying seller of Market Purchase: " +
      JSON.stringify({
      	seller: seller.user_tag,
      	buyer: buyer.user_tag,
      	totalCost,
      	price: marketCard.price,
      })
	);
	const embed = createEmbed()
		.setTitle(DEFAULT_SUCCESS_TITLE)
		.setThumbnail(marketCard.filepath)
		.setDescription(
			`Congratulations summoner! You have sold your __${
				marketCard.rank
			}__ **Level ${marketCard.character_level} ${titleCase(
				marketCard.name
			)}** on the Global Market and received __${totalCost}__ Gold ${
				emoji.gold
			}!`
		);
	DMUser(client, embed, seller.user_tag);
}

function notifyBuyer(channel: ChannelProp, marketCard: IMarketProps) {
	const embed = createEmbed()
		.setTitle(DEFAULT_SUCCESS_TITLE)
		.setThumbnail(marketCard.filepath)
		.setDescription(
			`Congratulations summoner! You have spent __${marketCard.price}__ Gold ${
				emoji.gold
			} and received __${marketCard.rank}__ **Level ${
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
	const embed = createEmbed()
		.setTitle(DEFAULT_ERROR_TITLE)
		.setThumbnail(params.client.user?.displayAvatarURL() || "")
		.setAuthor({
			name: params.author.username,
			iconURL: params.author.displayAvatarURL(),
		});
	if (buyer.gold < marketCard.price) {
		embed.setDescription(
			"You do not have sufficient gold to purchase this card"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		if (!OWNER_DISCORDID) return;
		const dealer = await getRPGUser({ user_tag: OWNER_DISCORDID });
		if (!dealer) {
			params.channel?.sendMessage("Something went wrong!");
			return;
		}
		const seller = await getUser({
			id: marketCard.user_id,
			is_banned: false,
		});
		if (!seller) {
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
			}
		);
		await delFromMarket({ id: marketCard.id });
		notifyBuyer(params.channel, marketCard);
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
			(data, opts) => {
				if (data) {
					const desc = `Are you sure you want to purchase **${titleCase(
						data.name
					)}** for __${data.price}__ gold ${emoji.gold}`;
					embed = createConfirmationEmbed(author, client)
						.setDescription(desc)
						.setThumbnail(data.filepath);
				}
				if (opts?.isDelete) {
					sentMessage.delete();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.market.shop.buy.purchaseCard(): something went wrong",
			err
		);
		return;
	}
};
