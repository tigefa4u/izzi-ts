import { ChannelProp, ConfirmationInteractionParams, FilterProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	getMarket,
	getMarketCollection,
} from "api/controllers/MarketsController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { DEFAULT_ERROR_TITLE, PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createMarketList } from "helpers/embedLists/market";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { purchaseCard } from "./shop/buy";
import { removeCardFromMarket } from "./shop/remove";
import { sellCard } from "./shop/sell";
import { subcommands } from "./subcommands";

export const market = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const cmd = args[0];
		const subcommand = filterSubCommands(cmd, subcommands);
		const subCommandParams = {
			context,
			client,
			author,
			args
		};
		if (subcommand === "buy") {
			args.shift();
			purchaseCard(subCommandParams);
			return;
		} else if (subcommand === "sell") {
			args.shift();
			sellCard(subCommandParams);
			return;
		} else if (subcommand === "remove") {
			args.shift();
			removeCardFromMarket(subCommandParams);
			return;
		}
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (Object.keys(params).length <= 0) return;
		const filter = clone(PAGE_FILTER);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0]);
			delete params.page;
		}
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			params,
			filter,
			getMarket,
			(data, opts) => {
				if (data) {
					const list = createMarketList(data.data);
					embed = createEmbedList({
						author,
						list,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages,
						totalCount: data.metadata.totalCount,
						title: "Global Market :shopping_cart:",
						description:
              "All Cards available on the Global Market are shown below.",
						pageName: "Market",
						client,
						pageCount: data.data.length,
					});
				} else {
					embed.setDescription("No Cards available");
				}
				if (opts?.isEdit) {
					sentMessage.editMessage(embed);
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
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
			"modules.commands.rpg.market.market: ERROR",
			err
		);
		return;
	}
};

export async function validateMarketCard(
	id: number,
	channel: ChannelProp,
	client: ConfirmationInteractionParams<undefined>["client"],
	user_id: number,
	options?: {
    notFoundError?: boolean;
    cardOwnerError?: boolean;
    duplicateError?: boolean;
  }
) {
	const validCard = await getMarketCollection({
		is_on_market: true,
		collection_id: id,
	});
	const embed = createEmbed()
		.setTitle(DEFAULT_ERROR_TITLE)
		.setThumbnail(client.user?.displayAvatarURL() || "");
	if (!validCard && options?.notFoundError === true) {
		embed.setDescription("We could not find the card you were looking for.");
		channel?.sendMessage(embed);
		return;
	}
	if (validCard && options?.duplicateError === true) {
		embed.setDescription(
			"This card is already available on the Global Market." +
			"Use the remove command to remove the card from the Market."
		);
		channel?.sendMessage(embed);
		return;
	}
	if (validCard?.user_id === user_id && options?.cardOwnerError === true) {
		loggers.info("Market card invalid. Reason: Card Owner " + user_id);
		embed.setDescription(
			"You cannot purchase your own card, use the remove command to remove the card from the Global Market."
		);
		channel?.sendMessage(embed);
		return;
	}
	return validCard;
}
