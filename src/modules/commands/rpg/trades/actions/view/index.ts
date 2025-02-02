import {
	SelectMenuCallbackParams,
	SelectMenuOptions,
} from "@customTypes/selectMenu";
import { TradeActionProps, TradeQueueProps } from "@customTypes/trade";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone, groupByKey } from "utility";
import { selectionInteraction } from "utility/SelectMenuInteractions";
import { numericWithComma } from "helpers/index";

const processViewCardsInTrade = (
	params: SelectMenuCallbackParams<{ tradeQueue: TradeQueueProps }>,
	value: string
) => {
	const tradeQueue = params.extras?.tradeQueue;
	if (!value || value.toLowerCase() === "no" || !tradeQueue) return;
	const queue = clone(tradeQueue);
	const keys = Object.keys(queue);
	let desc = "";
	keys.forEach((key, i) => {
		desc = `${desc}\n${i === 0 ? "" : "\n"}**${
			queue[key].username
		}'s Queue**\n${queue[key].queue
			.slice(0, 10)
			.map(
				(item) =>
					`**${titleCase(item.name || "No Name")}** ${titleCase(item.rank)} [${
						item.id
					}]`
			)
			.join("\n")}`;

		if (queue[key].queue.length > 10) {
			desc = `${desc} +__${queue[key].queue.length - 10}__ more`;
		}
	});

	const embed = createEmbed(params.author, params.client)
		.setTitle("View Cards in Trade")
		.setDescription(desc)
		.setHideConsoleButtons(true);

	params.channel?.sendMessage(embed);
	return;
};

const viewCardsInTrade = async ({
	client,
	author,
	channel,
	tradeQueue,
}: TradeActionProps) => {
	const menuOptions = [
		{
			label: "Yes",
			value: "yes",
		},
		{
			label: "No",
			value: "no",
		},
	];

	const options: SelectMenuOptions = {
		extras: { placeholder: "Do you want to view cards in trade?" },
		menuOptions,
	};

	const embed = createEmbed()
		.setTitle("View Trade Cards")
		.setDescription("View all the cards in trade.")
		.setHideConsoleButtons(true);
	const params = {
		author,
		channel,
		client,
		extras: { tradeQueue },
	};
	const selectMenu = await selectionInteraction(
		channel,
		author.id,
		options,
		params,
		processViewCardsInTrade,
		{ max: menuOptions.length } // Allow to choose multiple items
	);

	if (selectMenu) {
		embed.setButtons(selectMenu);
	}
	channel?.sendMessage(embed);
	return;
};

export const viewTrade = async ({
	author,
	client,
	tradeQueue,
	tradeId,
	channel,
}: TradeActionProps) => {
	try {
		const embed = createEmbed(author, client)
			.setTitle(`Trade View ${tradeId}`)
			.setDescription(
				`All the items in the Trade Queue are shown below\n\n${Object.keys(
					tradeQueue
				)
					.map((id) => {
						const trader = tradeQueue[id];
						return prepareTradeQueue(trader);
					})
					.join("\n\n")}`
			)
			.setHideConsoleButtons(true);
		channel?.sendMessage(embed);
		// await viewCardsInTrade({
		// 	client,
		// 	author,
		// 	channel,
		// 	tradeQueue,
		// 	tradeId,
		// 	args: [],
		// });
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.view.viewTrade: ERROR",
			err
		);
		return;
	}
};

export const prepareTradeQueue = (trader: TradeQueueProps[""]) => {
	const nonFodderCards = trader.queue.filter((q) => !q.is_fodder);
	const fodders = trader.queue.filter((q) => q.is_fodder);
	const rankGroup = groupByKey(nonFodderCards, "rank");
	const keys = Object.keys(rankGroup);
	return `**${trader.username}'s Queue**${
		keys.length > 0
			? `\n${keys
				.map(
					(k) =>
						`__${rankGroup[k].length}x__ ${titleCase(
							k
						)} ${rankGroup[k]
							.slice(0, 10)
							.map(
								(r) =>
									`**${titleCase(r.name || "No Name")} (${r.id})**`
							)
							.join(", ")}${
							rankGroup[k].length > 10
								? ` (__${rankGroup[k].length - 10}__ more)`
								: ""
						} card(s)`
				)
				.join("\n")}`
			: ""
	}${
		fodders.length > 0
			? `\n${fodders
				.slice(0, 5)
				.map(
					(f) =>
						`__${f.count}x__ Platinum ${titleCase(
							f.name || "No Name"
						)}`
				)
				.join(", ")}${
				fodders.length > 5 ? `(__${fodders.length - 5}__ more)` : ""
			} card(s) **(Fodders)**`
			: ""
	}\n__${numericWithComma(trader.gold)}__ gold ${emoji.gold}`;
};