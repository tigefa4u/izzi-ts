import { TradeActionProps } from "@customTypes/trade";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { titleCase } from "title-case";
import { groupByKey } from "utility";

export const viewTrade = async ({
	author, client, tradeQueue, tradeId, channel 
}: TradeActionProps) => {
	try {
		const embed = createEmbed(author, client).setTitle(`Trade View ${tradeId}`)
			.setDescription(`All the items in the Trade Queue are shown below\n\n${
				Object.keys(tradeQueue).map((id) => {
					const trader = tradeQueue[id];
					const rankGroup = groupByKey(trader.queue, "rank");
					const keys = Object.keys(rankGroup);
					return `**${trader.username}'s Queue**${keys.length > 0 ? 
						`\n${keys.map((k) => `__${rankGroup[k].length}x__ ${titleCase(k)} card(s)`).join(",")}`
						: ""}\n__${trader.gold}__ gold ${emoji.gold}`;
				}).join("\n\n")
			}`);
		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.view.viewTrade(): something went wrong",
			err
		);
		return;
	}
};
