import { AuthorProps, ChannelProp, FilterProps, ParamsFromArgsRT } from "@customTypes";
import { CharactersReturnType } from "@customTypes/characters";
import {
	CollectionParams,
	CollectionProps,
	CT,
} from "@customTypes/collections";
import {
	SelectMenuCallbackParams,
	SelectMenuOptions,
} from "@customTypes/selectMenu";
import { AddCardsToTradeProps, TradeActionProps } from "@customTypes/trade";
import { getCollection } from "api/controllers/CollectionsController";
import { createEmbed } from "commons/embeds";
import { Client, MessageEmbed } from "discord.js";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	FODDER_RANKS,
	MAX_CARDS_IN_TRADE,
} from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone, groupByKey } from "utility";
import { fetchParamsFromArgs } from "utility/forParams";
import { selectionInteraction } from "utility/SelectMenuInteractions";
import { delFromQueue, getTradeQueue, setTradeQueue } from "../../queue";
import { viewTrade } from "../view";


const addCardsToTrade = async ({
	collections,
	embed,
	channel,
	tradeId,
	author,
	client,
	args,
}: AddCardsToTradeProps) => {
	collections = collections?.filter((c) => !c.is_on_cooldown && !FODDER_RANKS.includes(c.rank));
	if (!collections || collections.length <= 0) {
		embed.setDescription("You do not have sufficient cards to trade." +
		"\n\n**Note: To trade Fodders use ``iz tr add fodds -n <name> -l <limit>``**");
		channel?.sendMessage(embed);
		return;
	}
	const arr = collections.map((coll) => ({
		id: coll.id,
		user_id: coll.user_id,
		rank: coll.rank,
		name: coll.name,
		count: 1,
		character_id: coll.character_id
	}));
	const tradeQueue = await getTradeQueue(tradeId);
	if (!tradeQueue) {
		embed.setDescription(`The Trade ${tradeId} has expired.`);
		channel?.sendMessage(embed);
		return;
	}
	const trader = tradeQueue[author.id];
	trader.queue = [ ...new Set([ ...trader.queue, ...arr ]) ];
	loggers.info(`Trade Queue for user: ${trader.user_tag} Queue:`, trader.queue);
	const refetchQueue = await getTradeQueue(tradeId);
	if (!refetchQueue) {
		return delFromQueue(tradeId);
	}
	refetchQueue[trader.user_tag] = trader;
	setTradeQueue(tradeId, refetchQueue);
	const rankGroup = groupByKey(arr, "rank");
	const keys = Object.keys(rankGroup);
	const desc = `${
		keys.length > 0
			? keys
				.map((key) => `__${rankGroup[key].length}x__ ${titleCase(key)}`)
				.join(" ")
			: 0
	} card(s) have been added to the trade!
	 Use \`\`tr cancel/confirm/view\`\` to cancel/confirm/view the trade.`;

	embed
		.setTitle(DEFAULT_SUCCESS_TITLE)
		.setDescription(desc)
		.setHideConsoleButtons(true);
	channel?.sendMessage(embed);
	viewTrade({
		author,
		client,
		tradeQueue,
		tradeId,
		channel,
		args,
	});
	return;
};

const handleCharacterSelect = async (
	options: SelectMenuCallbackParams<{
    characters: CharactersReturnType;
    tradeId: string;
    args: string[];
    options: CollectionParams & CT;
	callback: (...params: any) => void;
	callbackExtras: Record<string, any>;
  }>,
	value: string
) => {
	try {
		const characters = options.extras?.characters;
		const tradeId = options.extras?.tradeId;
		const args = options.extras?.args;
		const queryOptions = options.extras?.options;
		if (!characters || !tradeId || !queryOptions) return;
		const character = characters.find((c) => c.name === value);
		if (!character) return;
		queryOptions.name = character.name;
		queryOptions.isExactMatch = true;
		loggers.info(
			"trades.actions.add.multipleCards.handleCharacterSelect: " +
        "fetching collections with query params: ",
			queryOptions
		);

		/**
		 * We are making the db call again here to handle the scenario
		 * where the user stalls at the selection menu.
		 * So, we need to revalidate if the cards belong to the user.
		 * Maybe think of a better approach instead of making db calls.
		 */
		const collections = await getCollection(queryOptions);
		const embed = createEmbed(options.author, options.client).setTitle(
			DEFAULT_ERROR_TITLE
		);
		if (!collections || collections.length <= 0) {
			embed.setDescription("You do not have sufficient cards to trade.");
			options.channel?.sendMessage(embed);
			return;
		}
		if (typeof options.extras?.callback === "function") {
			options.extras.callback({
				collections,
				embed,
				channel: options.channel,
				tradeId,
				client: options.client,
				args: args || [],
				author: options.author,
				extras: options.extras.callbackExtras
			});
		}
		return;
	} catch (err) {
		loggers.error(
			"trades.actions.add.multipleCards.handleCharacterSelect: ERROR",
			err
		);
		return;
	}
};

type PT = {
	options: Record<string, string | number | string[] | number[] | boolean | undefined>;
	author: AuthorProps;
	client: Client;
	params: ParamsFromArgsRT<FilterProps>;
	channel: ChannelProp;
	args: string[];
	tradeId: string;
	callback: (...params: any) => void;
	callbackExtras: Record<string, any>;
}
export const processCardsToTrade = async ({
	options, client, channel, args, params, tradeId, author, callback, callbackExtras
}: PT) => {
	const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
	await getCollection(clone(options), async (characters, collections) => {
		const hasNonTradableCard = collections?.find((c) => !c.is_tradable);
		if (hasNonTradableCard) {
			const newEmbed = createEmbed(author, client)
				.setTitle(":warning: Non Tradable Card detected")
				.setDescription(
					`One or more card(s) you are trying to trade is non tradable **(${titleCase(
						hasNonTradableCard.name || "No Name"
					)})** and will not be added to the trade queue.`
				)
				.setHideConsoleButtons(true);
			channel?.sendMessage(newEmbed);
		}
		embed.setTitle(DEFAULT_ERROR_TITLE);
		collections = collections?.filter(
			(c) =>
				!c.is_on_cooldown && c.is_tradable
		);
		if (!collections || collections.length <= 0) {
			embed.setDescription("You do not have sufficient cards to trade." +
			"\n\n**Note: To trade Fodders use ``iz tr add fodder -n <name> -l <limit>``.**");
			channel?.sendMessage(embed);
			return;
		}
		if (characters.length > 1 && params.name) {
			loggers.info(
				"addMultipleCards: multiple characters found for query params: ",
				params
			);
			loggers.info(
				"addMultipleCards: multiple characters found ",
				characters
			);
			if (characters.length > 20) characters.splice(0, 20);
			const selectMenuOptions = {
				menuOptions: characters.map((c) => ({
					value: c.name,
					label: titleCase(c.name),
				})),
			} as SelectMenuOptions;
			const selectMenu = await selectionInteraction(
				channel,
				author.id,
				selectMenuOptions,
				{
					channel: channel,
					client,
					author: author,
					extras: {
						characters,
						tradeId,
						args,
						options: clone(options),
						callback,
						callbackExtras
					},
				},
				handleCharacterSelect,
				{ max: characters.length * 2 }
			);

			if (selectMenu) {
				embed.setButtons(selectMenu);
			}

			embed
				.setTitle(`Trade ${tradeId}`)
				.setDescription("We found multiple cards in your inventory");
			channel?.sendMessage(embed);
		} else {
			callback({
				collections,
				embed,
				channel,
				tradeId,
				author,
				args,
				client,
				extras: callbackExtras
			});
		}
	});
};

export const addMultipleCards = async ({
	channel,
	client,
	author,
	args,
	tradeQueue,
	tradeId,
}: TradeActionProps) => {
	try {
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (!params.rank || params.rank.length <= 0) {
			channel?.sendMessage("Please specify a valid Rank");
			return;
		}
		channel?.sendMessage("Adding multiple cards to trade...");
		if (params.limit && typeof params.limit === "object") {
			params.limit = Number(params.limit[0] || 1);
			if (isNaN(params.limit)) params.limit = 1;
		} else if (!params.limit) {
			params.limit = 1;
		} else if (params.limit > MAX_CARDS_IN_TRADE) {
			params.limit = MAX_CARDS_IN_TRADE;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const trader = tradeQueue[author.id];
		if (
			trader.queue.length > MAX_CARDS_IN_TRADE ||
      params.limit > MAX_CARDS_IN_TRADE ||
      trader.queue.length + params.limit > MAX_CARDS_IN_TRADE
		) {
			embed.setDescription(
				`You cannot trade more than __${MAX_CARDS_IN_TRADE}__ cards at once`
			);
			channel?.sendMessage(embed);
			return;
		}
		const options = {
			user_id: trader.user_id,
			rank: params.rank,
			is_on_market: false,
			limit: params.limit,
			is_item: false,
			name: params.name,
			// isExactMatch: true,
			is_on_cooldown: false,
			isForTrade: true,
		};
		const exclude_ids = trader.queue.map((i) => i.id);
		if (exclude_ids.length > 0) {
			Object.assign(options, { exclude_ids });
		}
		processCardsToTrade({
			options,
			channel,
			client,
			tradeId,
			args,
			author,
			params,
			callback: addCardsToTrade,
			callbackExtras: {}
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.add.addMultipleCards: ERROR",
			err
		);
		return;
	}
};
