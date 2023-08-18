import { FilterProps } from "@customTypes";
import { AddCardsToTradeProps, TradeActionProps, TradeQueueProps } from "@customTypes/trade";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, FODDER_RANKS, MAX_CARDS_IN_TRADE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { fetchParamsFromArgs } from "utility/forParams";
import { delFromQueue, getTradeQueue, setTradeQueue } from "../../queue";
import { viewTrade } from "../view";
import { processCardsToTrade } from "./multipleCards";

/**
 * Add fodders
 */
const addCardsToTrade = async ({
	collections,
	embed,
	channel,
	tradeId,
	author,
	client,
	args,
	extras
}: AddCardsToTradeProps & { extras: { limit: number; }; }) => {
	collections = collections?.filter((c) => !c.is_on_cooldown && FODDER_RANKS.includes(c.rank));
	if (!collections || collections.length <= 0) {
		embed.setDescription("You do not have sufficient cards to trade." +
		"\n\n**Note: To trade Fodders use ``iz tr add fodds -n <name> -l <limit>``**");
		channel?.sendMessage(embed);
		return;
	}
	let remainingCount = extras.limit || 1;
	const arr = collections.map((c) => {
		if (remainingCount <= 0) return;
		let count = 1;
		if (!c.card_count) c.card_count = 1;
		if (c.card_count >= remainingCount) {
			count = remainingCount;
			remainingCount = 0;
		} else {
			count = c.card_count;
			remainingCount = remainingCount - c.card_count;
		}
		return {
			name: c.name,
			rank: c.rank,
			id: c.id,
			user_id: c.user_id,
			count,
			is_fodder: true,
			character_id: c.character_id
		};
	}).filter(Boolean) as TradeQueueProps[0]["queue"];
	const tradeQueue = await getTradeQueue(tradeId);
	if (!tradeQueue) {
		embed.setDescription(`The Trade ${tradeId} has expired.`);
		channel?.sendMessage(embed);
		return;
	}
	const trader = tradeQueue[author.id];
	trader.queue = [ ...new Set([ ...trader.queue, ...arr ]) ];
	loggers.info(`[Fodder] Trade Queue for user: ${trader.user_tag} Queue:`, trader.queue);
	const refetchQueue = await getTradeQueue(tradeId);
	if (!refetchQueue) {
		return delFromQueue(tradeId);
	}
	refetchQueue[trader.user_tag] = trader;
	setTradeQueue(tradeId, refetchQueue);

	const desc = `${arr.map((a) => {
		return `__${a.count}x__ Platinum ${titleCase(a.name || "No Name")}`;
	}).join(" ")} card(s) have been added to trade!\n` +
    "Use ``tr cancel/confirm/view`` to cancel/confirm/view the trade.";

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

export const addFoddersToTrade = async ({
	channel,
	client,
	author,
	args,
	tradeQueue,
	tradeId,
}: TradeActionProps) => {
	try {
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (params.limit && typeof params.limit === "object") {
			params.limit = Number(params.limit[0] || 1);
			if (isNaN(params.limit)) params.limit = 1;
		} else if (!params.limit) {
			params.limit = 1;
		} else if (params.limit > MAX_CARDS_IN_TRADE) {
			params.limit = MAX_CARDS_IN_TRADE;
		}
		const trader = tradeQueue[author.id];
		const fodders = trader.queue.filter((q) => q.is_fodder);

		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if ((fodders.length + params.limit) > MAX_CARDS_IN_TRADE) {
			embed.setDescription(
				`You cannot trade more than __${MAX_CARDS_IN_TRADE}__ cards at once`
			);
			channel?.sendMessage(embed);
			return;
		}
		const options = {
			user_id: trader.user_id,
			rank: "platinum",
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
			client,
			channel,
			args,
			params,
			tradeId,
			author,
			callback: addCardsToTrade,
			callbackExtras: { limit: params.limit || 1 }
		});
		return;
	} catch (err) {
		loggers.error("trade.action.add.addFoddersToTrade: ERROR", err);
		return;
	}
};