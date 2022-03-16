import { FilterProps } from "@customTypes";
import { TradeActionProps } from "@customTypes/trade";
import { getCollection } from "api/controllers/CollectionsController";
import { createEmbed } from "commons/embeds";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	MAX_CARDS_IN_TRADE,
} from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { groupByKey } from "utility";
import { fetchParamsFromArgs } from "utility/forParams";
import { setTradeQueue } from "../../queue";
import { viewTrade } from "../view";

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
		if (params.limit && typeof params.limit === "object") {
			params.limit = Number(params.limit[0]);
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
		};
		const exclude_ids = trader.queue.map((i) => i.id);
		if (exclude_ids.length > 0) {
			Object.assign(options, { exclude_ids });
		}
		const collections = await getCollection(options);
		if (!collections || collections.length <= 0) {
			embed.setDescription("You do not have sufficient cards to trade.");
			channel?.sendMessage(embed);
			return;
		}
		const arr = collections.map((coll) => ({
			id: coll.id,
			user_id: coll.user_id,
			rank: coll.rank,
			name: coll.name,
		}));
		trader.queue = [ ...new Set([ ...trader.queue, ...arr ]) ];
		loggers.info(`Trade Queue for user: ${trader.user_tag} Queue: ${JSON.stringify(trader.queue)}`);
		tradeQueue[trader.user_tag] = trader;
		setTradeQueue(tradeId, tradeQueue);
		const rankGroup = groupByKey(arr, "rank");
		const keys = Object.keys(rankGroup);
		const desc = `${
			keys.length > 0
				? keys
					.map((key) => `__${rankGroup[key].length}x__ ${titleCase(key)}`)
					.join(" ")
				: 0
		} card(s) have been added to the trade! Use \`\`tr cancel/confirm/view\`\` to cancel/confirm/view the trade.`;

		embed.setTitle(DEFAULT_SUCCESS_TITLE).setDescription(desc);
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
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.add.addMultipleCards(): something went wrong",
			err
		);
		return;
	}
};
