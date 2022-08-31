import { TradeActionProps } from "@customTypes/trade";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, MAX_CARDS_IN_TRADE } from "helpers/constants";
import loggers from "loggers";
import { getSortCache } from "modules/commands/rpg/sorting/sortCache";
import { titleCase } from "title-case";
import { groupByKey } from "utility";
import { setTradeQueue } from "../../queue";
import { viewTrade } from "../view";

export const addCardByIds = async ({
	author,
	client,
	channel,
	tradeQueue,
	tradeId,
	args,
}: TradeActionProps) => {
	try {
		const trader = tradeQueue[author.id];
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (trader.queue.length > MAX_CARDS_IN_TRADE) {
			embed.setDescription(`You cannot trade more than __${MAX_CARDS_IN_TRADE}__ cards at once`);
			channel?.sendMessage(embed);
			return;
		}
		const ids = args
			.shift()
			?.split(",")
			.map((i) => Number(i.trim()));
		if (!ids || !ids.every(Number)) return;
		const options = {
			user_id: trader.user_id,
			row_number: ids,
			is_on_market: false,
			is_on_cooldown: false
		};
		// const exclude_ids = trader.queue.map((i) => i.id);
		// if (exclude_ids.length > 0) {
		// 	Object.assign(options, { exclude_ids });
		// }
		const sort = await getSortCache(author.id);
		let collections = await getCardInfoByRowNumber(options, sort);
		collections = collections?.filter(c => !c.is_on_cooldown);
		if (!collections || collections.length <= 0) {
			embed.setDescription(
				"The card(s) you are looking for is either not available or is on sale on the Global Market,"
			);
			channel?.sendMessage(embed);
			return;
		}
		const arr = collections.filter((c) => !trader.queue.find(q => q.id === c.id)).map((coll) => ({
			id: coll.id,
			user_id: coll.user_id,
			rank: coll.rank,
			name: coll.name,
		}));
		if (arr.length > 0) {
			loggers.info("adding cards to trade: " + JSON.stringify(arr));
		}
		trader.queue = [ ...new Set([ ...trader.queue, ...arr ]) ];
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
			channel,
			tradeId,
			tradeQueue,
			args,
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.add.addCardByIds(): something went wrong",
			err
		);
		return;
	}
};
