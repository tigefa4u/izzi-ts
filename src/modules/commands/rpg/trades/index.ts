import {
	ChannelProp,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { TradeQueueProps } from "@customTypes/trade";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message, MessageEmbed } from "discord.js";
import emoji from "emojis/emoji";
import { generateUUID, getIdFromMentionedString } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	REACTIONS,
	REQUIRED_TRADE_LEVEL,
} from "helpers/constants";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";
import * as queue from "./queue";

function getInTrade(traderId: string, tradeeId: string) {
	return Promise.all([ queue.getTrade(traderId), queue.getTrade(tradeeId) ]);
}

async function clearTrade(
	id: string,
	tradeId: string,
	username: string,
	embed: MessageEmbed,
	channel: ChannelProp
) {
	const checkQueue = await queue.getTradeQueue(tradeId);
	if (!checkQueue) {
		await queue.delFromTrade(id);
	}
	embed
		.setDescription(
			`Summoner **${username}** is currently in a Trade! ` +
        "Use ``tr cancel/confirm`` to confirm/cancel your current trade."
		)
		.setFooter({ text: `Trade ID: ${tradeId}. Your trade will auto expire in 10mins.`, });
	channel?.sendMessage(embed);
	return;
}

function prepareQueue(id: string, username: string): TradeQueueProps {
	return {
		[id]: {
			username,
			hasConfirmed: false,
			queue: [],
			gold: 0,
		},
	};
}

async function validateAndConfirmTrade(
	params: ConfirmationInteractionParams<{
    mentionId: string;
    mentionUsername: string;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const mentionId = params.extras?.mentionId;
	if (!mentionId) return;
	const embed = createEmbed(params.author, params.client)
		.setTitle(DEFAULT_ERROR_TITLE)
		.setThumbnail(params.client.user?.displayAvatarURL() || "");
	const author = params.author;
	const [ userTradeId, mentionedUserTradeId ] = await getInTrade(
		author.id,
		mentionId
	);
	if (userTradeId) {
		return await clearTrade(
			author.id,
			userTradeId,
			author.username,
			embed,
			params.channel
		);
	}
	if (mentionedUserTradeId) {
		return await clearTrade(
			mentionId,
			mentionedUserTradeId,
			params.extras?.mentionUsername || "",
			embed,
			params.channel
		);
	}
	if (options?.isConfirm) {
		const tradeId = generateUUID(4);
		loggers.info(`Trade initiated for users: ${params.author.id} & ${mentionId}, Trade ID: ${tradeId}`);
		await queue.setTrade(params.author.id, tradeId);
		await queue.setTrade(mentionId, tradeId);
		const tradeQueue = {
			...prepareQueue(params.author.id, params.author.username),
			...prepareQueue(mentionId, params.extras?.mentionUsername || ""),
		};
		await queue.setTradeQueue(tradeId, tradeQueue);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Trade has been initiated! Trade ID: ${tradeId}\n` +
          "Use ``trade add card(s) <filter>`` to add card(s) into your trade queue.\n" +
          "Use `` tr confirm/cancel`` to confirm/cancel your trade. " +
          "Use ``iz trade view`` to view the trade. " +
          "You can use ``tr add cards -l <num>`` to specify the number of cards you want to add."
			)
			.setFooter({ text: "Your trade will auto expire in 10mins" });

		params.channel?.sendMessage(embed);
		return;
	}
	return { initiateTrade: true };
}

export const trade = async ({ context, args, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const mentionId = getIdFromMentionedString(args.shift() || "");
		if (!mentionId || mentionId === author.id) return;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.level < REQUIRED_TRADE_LEVEL) {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, you must be atleast level __${REQUIRED_TRADE_LEVEL}__ to trade`
			);
			return;
		}
		const mentionedUser = await getRPGUser({ user_tag: mentionId });
		if (!mentionedUser) return;
		if (mentionedUser.level < REQUIRED_TRADE_LEVEL) {
			context.channel?.sendMessage(
				`Summoner **${mentionedUser.username}**, must be atleast level __${REQUIRED_TRADE_LEVEL}__ to trade`
			);
			return;
		}
		const params = {
			channel: context.channel,
			author,
			client,
			extras: {
				mentionId,
				mentionUsername: mentionedUser.username,
			},
		};
		const embed = createEmbed(author, client);
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndConfirmTrade,
			(data, opts) => {
				if (data) {
					embed
						.setTitle(`Trade Request ${emoji.tradeic}`)
						.setDescription(
							`Hey **${mentionedUser.username}** ${emoji.calm}` +
                            `\n**${author.username}** has requested for a Trade. ` +
                            `React with ${REACTIONS.confirm.emoji} to initiate a trade.`
						);
				}
				if (opts?.isDelete) {
					sentMessage.delete();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		context.channel?.sendMessage(embed).then((msg) => {
			sentMessage = msg;
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.trade(): something went wrong",
			err
		);
		return;
	}
};
