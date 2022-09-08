import { ChannelProp } from "@customTypes";
import { TradeActionProps, TradeQueueProps } from "@customTypes/trade";
import {
	getCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import * as queue from "../../queue";
import { viewTrade } from "../view";

async function validateTraderQueue(
	trader: TradeQueueProps[""],
	channel: ChannelProp
) {
	const embed = createEmbed().setTitle(DEFAULT_ERROR_TITLE);
	const user = await getRPGUser({ user_tag: trader.user_tag });
	if (!user) {
		channel?.sendMessage("Unable to process Trade");
		throw new Error("User not found during Trade: " + trader.user_tag);
	}
	if (trader.queue.length > 0) {
		const params = {
			user_id: user.id,
			ids: trader.queue.map((q) => q.id),
			is_on_market: false,
			is_item: false,
		};
		const collections = await getCollection(params);
		if (!collections || collections.length !== trader.queue.length) {
			embed.setDescription(
				"Trade has been cancelled due to insufficient cards. " +
          "(Hint: The card you are trying to Trade might be on the Global Market)"
			);
			channel?.sendMessage(embed);
			return;
		}
		if (user.selected_card_id) {
			const hasSelectedCard = trader.queue
				.map((q) => q.id)
				.includes(user.selected_card_id);
			if (hasSelectedCard) {
				embed.setDescription(
					"Trade has been cancelled. You cannot trade the card you've selected for battle!"
				);
				channel?.sendMessage(embed);
				return;
			}
		}
	}
	if (user.gold < trader.gold) {
		embed.setDescription("Trade has been cancelled due to insufficient gold.");
		channel?.sendMessage(embed);
		return;
	}
	return user;
}

export const confirmTrade = async ({
	tradeQueue,
	tradeId,
	channel,
	author,
	client,
	args,
}: TradeActionProps) => {
	try {
		const trader = tradeQueue[author.id];

		const embed = createEmbed(author, client).setTitle(DEFAULT_SUCCESS_TITLE);

		if (trader.hasConfirmed === true) {
			embed.setDescription(
				`Summoner **${author.username}**, you have already confirmed this Trade, ` +
          "please wait for the other participant to confirm"
			);
			channel?.sendMessage(embed);
			return;
		}
		trader.hasConfirmed = true;
		let invokeTrade = false;
		const keys = Object.keys(tradeQueue);
		const tradersConfirmed = keys.filter((key) => tradeQueue[key].hasConfirmed);
		if (tradersConfirmed.length === keys.length) {
			invokeTrade = true;
		}
		if (invokeTrade === false) {
			tradeQueue[trader.user_tag] = trader;
			queue.setTradeQueue(tradeId, tradeQueue);
			embed.setDescription("Trade Confirmed");
			channel?.sendMessage(embed);
			viewTrade({
				tradeQueue,
				tradeId,
				channel,
				author,
				client,
				args,
			});
			return;
		}
		channel?.sendMessage("Completing Trade, Please wait...");
		const trader_1 = tradeQueue[keys[0]];
		const trader_2 = tradeQueue[keys[1]];
		// loggers.info(
		// 	`Invoking Trade for ${trader_1.user_tag} & ${
		// 		trader_2.user_tag
		// 	} with Data: ${JSON.stringify(tradeQueue)}`
		// );
		const [ participantOne, participantTow ] = await Promise.all([
			validateTraderQueue(trader_1, channel),
			validateTraderQueue(trader_2, channel),
		]);
		queue.delFromQueue(tradeId), keys.map((k) => queue.delFromTrade(k));
		if (!participantOne || !participantTow) return;
		const promises = [];
		if (trader_1.gold > 0) {
			participantOne.gold = participantOne.gold - trader_1.gold;
			participantTow.gold = participantTow.gold + trader_1.gold;
		}
		if (trader_2.gold > 0) {
			participantTow.gold = participantTow.gold - trader_2.gold;
			participantOne.gold = participantOne.gold + trader_2.gold;
		}
		loggers.info(
			`trades.actions.confirm.confirmTrade(): Completing Trade for user ${
				trader_1.username
			} queue: ${JSON.stringify(trader_1.queue)} gold: ${trader_1.gold} & user: ${
				trader_2.user_tag
			} queue: ${JSON.stringify(trader_2.queue)} gold: ${trader_2.gold}`
		);
		// Update user only if there's gold trade
		if (trader_1.gold > 0 || trader_2.gold > 0) {
			promises.push(
				updateRPGUser(
					{ user_tag: participantOne.user_tag },
					{ gold: participantOne.gold }
				),
				updateRPGUser(
					{ user_tag: participantTow.user_tag },
					{ gold: participantTow.gold }
				)
			);
		}
		if (trader_1.queue.length > 0) {
			if (participantOne.selected_card_id) {
				const index = trader_1.queue.findIndex(
					(q) => q.id === participantOne.selected_card_id
				);
				if (index >= 0) {
					trader_1.queue.splice(index, 1);
				}
			}
			promises.push(
				updateCollection(
					{ ids: trader_1.queue.map((q) => q.id) },
					{
						user_id: trader_2.user_id,
						item_id: null,
						is_favorite: false,
						is_on_market: false,
						is_on_cooldown: true
					}
				),
				async () => {
					const dt = new Date();
					return trader_1.queue.map(async (q) => await Cache.set("card-cd::" + q.id, JSON.stringify({
						timestamp: new Date(),
						cooldownEndsAt: dt.setHours(dt.getHours() + 8)
					})));
				}
			);
		}
		if (trader_2.queue.length > 0) {
			if (participantTow.selected_card_id) {
				const index = trader_2.queue.findIndex(
					(q) => q.id === participantTow.selected_card_id
				);
				if (index >= 0) {
					trader_2.queue.splice(index, 1);
				}
			}
			promises.push(
				updateCollection(
					{ ids: trader_2.queue.map((q) => q.id) },
					{
						user_id: trader_1.user_id,
						item_id: null,
						is_favorite: false,
						is_on_market: false,
						is_on_cooldown: true
					}
				)
			);
		}
		await Promise.all(promises);
		const dt = new Date();
		await Promise.all([ ...trader_1.queue, ...trader_2.queue ].map(async (q) => {
			await Cache.set("card-cd::" + q.id, JSON.stringify({
				timestamp: new Date(),
				cooldownEndsAt: dt.setHours(dt.getHours() + 8)
			}));
			return Cache.expire && Cache.expire("card-cd::" + q.id, 60 * 60 * 8);
		}));
		embed.setDescription("Trade completed!");
		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.view.confirmTrade(): something went wrong",
			err
		);
		return;
	}
};
