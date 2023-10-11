import { TradeActionProps } from "@customTypes/trade";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { createEmbed } from "commons/embeds";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	FODDER_RANKS,
	MAX_CARDS_IN_TRADE,
} from "helpers/constants/constants";
import loggers from "loggers";
import { getSortCache } from "modules/commands/rpg/sorting/sortCache";
import { titleCase } from "title-case";
import { groupByKey } from "utility";
import { delFromQueue, delFromTrade, getTradeQueue, setTradeQueue } from "../../queue";
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
			embed
				.setDescription(
					`You cannot trade more than __${MAX_CARDS_IN_TRADE}__ cards at once`
				)
				.setHideConsoleButtons(true);
			channel?.sendMessage(embed);
			return;
		}

		// This is needed to accomodate the format
		// 1, 2, 3 and 1,2,3
		const ids = args.join(",")
			?.replace(/,,/g, ",")
			?.split(",")
			.map((i) => Number(i.trim()));
		if (!ids || !ids.every(Number)) return;
		const options = {
			user_id: trader.user_id,
			row_number: ids,
			// is_on_market: false,
			// is_on_cooldown: false,
		};
		// const exclude_ids = trader.queue.map((i) => i.id);
		// if (exclude_ids.length > 0) {
		// 	Object.assign(options, { exclude_ids });
		// }
		const sort = await getSortCache(author.id);
		let collections = await getCardInfoByRowNumber(options, sort);
		const hasNonTradableCard = collections?.find((c) => !c.is_tradable);
		if (hasNonTradableCard) {
			const newEmbed = createEmbed(author, client)
				.setTitle(":warning: Non Tradable Card detected")
				.setDescription(
					`One or more card(s) you are trying to trade is non tradable **(${titleCase(
						hasNonTradableCard.name
					)})** and will not be added to the trade queue.`
				).setHideConsoleButtons(true);
			channel?.sendMessage(newEmbed);
		}
		embed.setTitle(DEFAULT_ERROR_TITLE);
		collections = collections?.filter(
			(c) => !c.is_on_cooldown && c.is_tradable && !c.is_on_market && !FODDER_RANKS.includes(c.rank)
		);
		if (!collections || collections.length <= 0) {
			embed
				.setDescription(
					"The card(s) you are looking for is either not available or on cooldown " +
            "or is on sale on the Global Market." +
			"\n\n**Note: To trade Fodders use ``iz tr add fodds -n <name> -l <limit>`` command.**"
				)
				.setHideConsoleButtons(true);
			channel?.sendMessage(embed);
			return;
		}
		const arr = collections
			.filter((c) => !trader.queue.find((q) => q.id === c.id))
			.map((coll) => ({
				id: coll.id,
				user_id: coll.user_id,
				rank: coll.rank,
				name: coll.name,
				count: 1,
				character_id: coll.character_id
			}));
		if (arr.length > 0) {
			loggers.info("adding cards to trade: ", arr);
		}
		trader.queue = [ ...new Set([ ...trader.queue, ...arr ]) ];
		const refetchQueue = await getTradeQueue(tradeId);
		if (!refetchQueue) {
			await delFromQueue(tradeId);
			return;
		}
		refetchQueue[trader.user_tag] = trader;
		setTradeQueue(tradeId, refetchQueue);
		const rankGroup = groupByKey(arr, "rank");
		const keys = Object.keys(rankGroup);
		const desc = `${
			keys.length > 0
				? keys
					.map(
						(key) =>
							`__${rankGroup[key].length}x__ ${titleCase(key)} ${rankGroup[
								key
							]
								.slice(0, 50)
								.map((r) => `**${titleCase(r.name)} (${r.id})**`)
								.join(", ")}${
								rankGroup[key].length > 50 ? "(and more...)" : ""
							}`
					)
					.join(" ")
				: 0
		} card(s) have been added to the trade! Use \`\`tr cancel/confirm/view\`\` to cancel/confirm/view the trade.`;

		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(desc)
			.setHideConsoleButtons(true);
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
			"modules.commands.rpg.trades.actions.add.addCardByIds: ERROR",
			err
		);
		return;
	}
};
