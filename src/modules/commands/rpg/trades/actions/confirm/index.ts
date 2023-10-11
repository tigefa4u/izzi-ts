import { AuthorProps, ChannelProp } from "@customTypes";
import { TradeActionProps, TradeQueueProps } from "@customTypes/trade";
import {
	consumeFodders,
	directUpdateCreateFodder,
	getCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { OS_LOG_CHANNELS } from "helpers/constants/channelConstants";
import {
	DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, FODDER_RANKS, MIN_TRADE_CARDS_FOR_QUEST, QUEST_TYPES 
} from "helpers/constants/constants";
import loggers from "loggers";
import { validateAndCompleteQuest } from "modules/commands/rpg/quests";
import { titleCase } from "title-case";
import * as queue from "../../queue";
import { prepareTradeQueue, viewTrade } from "../view";

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
		const hasNoCharacterId = trader.queue.find((q) => !q.character_id);
		if (hasNoCharacterId) {
			embed.setDescription(
				"Trade has been cancelled due to corrupted data. " +
				"Please restart the trade using ``iz tr <@user>``."
			).setHideConsoleButtons(true);
			channel?.sendMessage(embed);
			return;
		}
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
			).setHideConsoleButtons(true);
			channel?.sendMessage(embed);
			return;
		}
		const fodders = trader.queue.filter((q) => q.is_fodder);
		const fodderCollections = collections.filter((c) => FODDER_RANKS.includes(c.rank));

		const fodderMeta = fodders.reduce((acc, r) => {
			acc[r.character_id] = r.count;
			return acc;
		}, {} as { [key: string]: number; });
		const fodderCollectionMeta = fodderCollections.reduce((acc, r) => {
			acc[r.character_id] = r.card_count || 1;
			return acc;
		}, {} as { [key: string]: number; });

		const invalidFodders = Object.keys(fodderMeta).find((cid) => {
			return (fodderCollectionMeta[cid] < fodderMeta[cid] || !fodderCollectionMeta[cid]);
		});
		if (invalidFodders) {
			embed.setDescription(
				"Trade has been cancelled due to insufficient cards. " +
	  "(Hint: Make sure you have the right amount of fodders you are trying to trade)"
			).setHideConsoleButtons(true);
			channel?.sendMessage(embed);
			return;
		}

		if (user.selected_card_id) {
			const hasSelectedCard = trader.queue
				.find((q) => {
					return q.id === user.selected_card_id;
				});
			if (hasSelectedCard) {
				user.selected_card_id = null;

				embed.setTitle("Warning :warning:").setDescription(
					"You are trading a card you've selected. " +
					`**__${titleCase(hasSelectedCard.rank)}__ ` +
					`${titleCase(hasSelectedCard.name || "No Name")} (${hasSelectedCard.id})**`
				).setHideConsoleButtons(true);
				channel?.sendMessage(embed);
				// return;
			}
		}
	}
	if (user.gold < trader.gold) {
		embed.setDescription("Trade has been cancelled due to insufficient gold.").setHideConsoleButtons(true);
		channel?.sendMessage(embed);
		return;
	}
	return user;
}

const invokeTradeFodders = async (fodder: TradeQueueProps[0]["queue"], receiver_uid: number) => {
	const cards = fodder.map((f) => ({
		character_id: f.character_id,
		user_id: receiver_uid,
		count: f.count
	}));
	
	const consumeable = fodder.map((f) => ({
		character_id: f.character_id,
		user_id: f.user_id,
		count: f.count
	}));
	loggers.info("Invoking fodder trade: ", consumeable, cards);
	return Promise.all([
		consumeFodders(consumeable),
		directUpdateCreateFodder(cards)
	]);
};

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

		const cardCount = trader.queue.reduce((acc, r) => acc = (acc || 0) + r.count, 0);

		if (trader.hasConfirmed === true) {
			embed.setDescription(
				`Summoner **${author.username}**, you have already confirmed this Trade, ` +
          "please wait for the other participant to confirm." +
		  `\n\n**You are trading __${cardCount}__ card(s) in total.**`
			).setHideConsoleButtons(true);
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
			const refetchQueue = await queue.getTradeQueue(tradeId);
			if (!refetchQueue) {
				return queue.delFromQueue(tradeId);
			}
			refetchQueue[trader.user_tag] = trader;
			queue.setTradeQueue(tradeId, refetchQueue);
			embed.setDescription("Trade Confirmed" +
			`\n\n**You are trading __${cardCount}x__ card(s) in total!**`)
				.setHideConsoleButtons(true);
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
			"trades.actions.confirm.confirmTrade: Completing Trade", {
				trader_1,
				trader_2
			});
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
			const trader_1_fodders = trader_1.queue.filter((q) => q.is_fodder);
			const trader_1_cards = trader_1.queue.filter((q) => !q.is_fodder);
			if (participantOne.selected_card_id) {
				const index = trader_1.queue.findIndex(
					(q) => q.id === participantOne.selected_card_id
				);
				if (index >= 0) {
					trader_1.queue.splice(index, 1);
				}
			}
			const trader1totalCardsTraded = trader_1.queue.reduce((acc, r) => acc + r.count, 0);
			if (trader1totalCardsTraded >= MIN_TRADE_CARDS_FOR_QUEST) {
				promises.push(validateAndCompleteQuest({
					user_tag: trader_1.user_tag,
					type: QUEST_TYPES.TRADING,
					options: {
						channel,
						client,
						author: {} as AuthorProps,
						extras: { tradeQueueLen: trader1totalCardsTraded },
					},
					level: 0
				}));
			}
			promises.push(
				updateCollection(
					{ ids: trader_1_cards.map((q) => q.id) },
					{
						user_id: trader_2.user_id,
						item_id: null,
						is_favorite: false,
						is_on_market: false,
						// is_on_cooldown: true
					}
				)
			);
			if (trader_1_fodders.length > 0) {
				promises.push(invokeTradeFodders(trader_1_fodders, trader_2.user_id));
			}
		}
		if (trader_2.queue.length > 0) {
			const trader_2_fodders = trader_2.queue.filter((q) => q.is_fodder);
			const trader_2_cards = trader_2.queue.filter((q) => !q.is_fodder);
			if (participantTow.selected_card_id) {
				const index = trader_2.queue.findIndex(
					(q) => q.id === participantTow.selected_card_id
				);
				if (index >= 0) {
					trader_2.queue.splice(index, 1);
				}
			}
			const trader2totalCardsTraded = trader_2.queue.reduce((acc, r) => acc + r.count, 0);
			if (trader2totalCardsTraded >= MIN_TRADE_CARDS_FOR_QUEST) {
				promises.push(validateAndCompleteQuest({
					user_tag: trader_2.user_tag,
					type: QUEST_TYPES.TRADING,
					options: {
						channel,
						client,
						author: {} as AuthorProps,
						extras: { tradeQueueLen: trader2totalCardsTraded },
					},
					level: 0
				}));
			}
			promises.push(
				updateCollection(
					{ ids: trader_2_cards.map((q) => q.id) },
					{
						user_id: trader_1.user_id,
						item_id: null,
						is_favorite: false,
						is_on_market: false,
						// is_on_cooldown: true
					}
				)
			);
			if (trader_2_fodders.length > 0) {
				promises.push(invokeTradeFodders(trader_2_fodders, trader_1.user_id));
			}
		}
		await Promise.all(promises);
		// await Promise.all([ ...trader_1.queue, ...trader_2.queue ].map(async (q) => {
		// 	const dt = new Date();
		// 	await Cache.set("card-cd::" + q.id, JSON.stringify({
		// 		timestamp: new Date(),
		// 		cooldownEndsAt: dt.setHours(dt.getHours() + 4)
		// 	}));
		// 	return Cache.expire && Cache.expire("card-cd::" + q.id, 60 * 60 * 4);
		// }));
		embed.setDescription("Trade completed!").setHideConsoleButtons(true);
		channel?.sendMessage(embed);

		const logChannel = await client.channels.fetch(OS_LOG_CHANNELS.TRADE) as ChannelProp | null;
		if (logChannel) {
			const logEmbed = createEmbed(author, client)
				.setTitle(`Trade Completed between ${trader_1.username} and ${trader_2.username}`)
				.setDescription(`${prepareTradeQueue(trader_1)}\n\n${prepareTradeQueue(trader_2)}`)
				.setHideConsoleButtons(true);

			logChannel.sendMessage(logEmbed);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.actions.view.confirmTrade: ERROR",
			err
		);
		return;
	}
};
