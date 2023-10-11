import { TradeActionProps } from "@customTypes/trade";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, MAX_GOLD_IN_TRADE } from "helpers/constants/constants";
import loggers from "loggers";
import { delFromQueue, getTradeQueue, setTradeQueue } from "../../queue";
import { viewTrade } from "../view";

export const addGoldToTrade = async ({
	args, client, author, channel, tradeQueue, tradeId
}: TradeActionProps) => {
	try {
		const amount = Number(args.shift());
		if (!amount || isNaN(amount)) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (amount > MAX_GOLD_IN_TRADE) {
			embed.setDescription(`You cannot add more than __${numericWithComma(MAX_GOLD_IN_TRADE)}__ ` +
			`gold ${emoji.gold} in Trade!`).setHideConsoleButtons(true);
			channel?.sendMessage(embed);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.gold < amount) {
			embed.setDescription("You do not have sufficient gold to trade.").setHideConsoleButtons(true);
			channel?.sendMessage(embed);
			return;
		}
		loggers.info(`${author.id} added ${amount} gold to trade`);
		const trader = tradeQueue[author.id];
		trader.gold = trader.gold + amount;
		const refetchQueue = await getTradeQueue(tradeId);
		if (!refetchQueue) {
			await delFromQueue(tradeId);
			return;
		}
		refetchQueue[trader.user_tag] = trader;
		await setTradeQueue(tradeId, refetchQueue);
		viewTrade({
			author,
			client,
			args,
			tradeId,
			tradeQueue,
			channel
		});
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully added __${numericWithComma(amount)}__ gold ${emoji.gold} to trade.`)
			.setHideConsoleButtons(true);
        
		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.add.addGoldToTrade: ERROR",
			err
		);
		return;
	}
};