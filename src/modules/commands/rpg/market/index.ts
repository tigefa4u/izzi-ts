import {
	ChannelProp,
	ConfirmationInteractionParams,
	FilterProps,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	getMarket,
	getMarketCollection,
} from "api/controllers/MarketsController";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData, Message } from "discord.js";
import { DEFAULT_ERROR_TITLE, PAGE_FILTER } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createDzMarketList, createMarketList } from "helpers/embedLists/market";
import { ranksMeta } from "helpers/constants/rankConstants";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { clone, isEmptyObject } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { purchaseCard } from "./shop/buy";
import { removeCardFromMarket } from "./shop/remove";
import { sellCard } from "./shop/sell";
import { showTaxInfo } from "./shop/tax";
import { subcommands } from "./subcommands";
import { getAllDzMarketCards, getDzMarketCollection } from "api/controllers/DarkZoneMarketsController";

export const listMarket = async ({
	context, client, args, options, isDarkZone 
}: BaseProps & { isDarkZone?: boolean; }) => {
	try {
		const { author } = options;
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (isEmptyObject(params)) {
			params.rank = [ ranksMeta.immortal.name ];
		}
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
			isDarkZone ? getAllDzMarketCards : getMarket,
			(data: any, opts) => {
				if (data) {
					let list: EmbedFieldData[] = [];
					if (isDarkZone) {
						list = createDzMarketList(data.data);
					} else {
						list = createMarketList(data.data);
					}
					embed = createEmbedList({
						author,
						list,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages,
						totalCount: data.metadata.totalCount,
						title: `${isDarkZone ? "Dark Zone" : "Global"} Market :shopping_cart:`,
						description:
              "All Cards available on the Market are shown below.",
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
		loggers.error("market.listMarket: ERROR", err);
		return;
	}
};

export const market = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const cmd = args[0];
		const subcommand = filterSubCommands(cmd, subcommands);
		const subCommandParams = {
			context,
			client,
			author,
			args,
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
		} else if (subcommand === "tax") {
			showTaxInfo(subCommandParams);
			return;
		} else if (subcommand === "redirect") {
			args.shift();

			// Disabled - use crosspost
			// Crosspost has rate limit of 10 messages per day,
			// Not recommended to use
			// globalMarketRedirect(subCommandParams);
			return;
		}
		listMarket({
			context,
			client,
			args,
			options,
			isDarkZone: false
		});
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.market.market: ERROR", err);
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
    isDarkZone?: boolean;
    user_tag?: string;
  }
) {
	const params = {
		is_on_market: true,
		collection_id: id,
	};
	const validCard: any = options?.isDarkZone
		? await getDzMarketCollection(params)
		: await getMarketCollection(params);

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
			`This card is already available on the ${options.isDarkZone ? "Dark Zone" : "Global"} Market.` +
        "Use the remove command to remove the card from the Market."
		);
		channel?.sendMessage(embed);
		return;
	}
	let condition = validCard?.user_id === user_id;
	if (options?.isDarkZone && options.user_tag) {
		condition = validCard?.user_tag === options.user_tag;
	}
	if (condition && options?.cardOwnerError === true) {
		loggers.info("Market card invalid. Reason: Card Owner " + user_id);
		embed.setDescription(
			"You cannot purchase your own card, use the remove command to remove " +
			`the card from the ${options.isDarkZone ? "Dark Zone" : "Global"} Market.`
		);
		channel?.sendMessage(embed);
		return;
	}
	return validCard;
}
