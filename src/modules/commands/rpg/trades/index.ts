import {
	ChannelProp,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { TradeQueueProps } from "@customTypes/trade";
import { getRPGUser, getUser } from "api/controllers/UsersController";
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
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { addToTrade } from "./actions/add";
import { cancelTrade } from "./actions/cancel";
import { confirmTrade } from "./actions/confirm";
import { viewTrade } from "./actions/view";
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
		.setFooter({ text: `Trade ID: ${tradeId}. Your trade will auto expire in 10mins.`, })
		.setHideConsoleButtons(true);
	channel?.sendMessage(embed);
	return;
}

function prepareQueue(
	id: string,
	username: string,
	user_id: number
): TradeQueueProps {
	return {
		[id]: {
			user_id,
			user_tag: id,
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
    mentionUserId: number;
    userId: number;
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
		loggers.info(
			`Trade initiated for users: ${params.author.id} & ${mentionId}, Trade ID: ${tradeId}`
		);
		const tradeQueue = {
			...prepareQueue(
				params.author.id,
				params.author.username,
				params.extras?.userId || 0
			),
			...prepareQueue(
				mentionId,
				params.extras?.mentionUsername || "",
				params.extras?.mentionUserId || 0
			),
		};
		await Promise.all([
			queue.setTrade(params.author.id, tradeId),
			queue.setTrade(mentionId, tradeId),
			queue.setTradeQueue(tradeId, tradeQueue),
		]);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Trade has been initiated! Trade ID: ${tradeId}\n` +
          "Use ``trade add card(s) <filter>`` to add card(s) into your trade queue.\n" +
          "Use `` tr confirm/cancel`` to confirm/cancel your trade. " +
          "Use ``iz trade view`` to view the trade. " +
          "You can use ``tr add cards -l <num>`` to specify the number of cards you want to add." +
		  "\n**__NOTE:__ Your selected card(s) for floor battles will not be traded.**"
			)
			.setFooter({
				text: "Your trade will auto expire in 10mins",
				iconURL: author.displayAvatarURL() 
			})
			.setHideConsoleButtons(true);

		params.channel?.sendMessage(embed);
		return;
	}
	return { initiateTrade: true };
}

export const trade = async ({ context, args, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "trade";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		const mentionId = getIdFromMentionedString(args.shift() || "");
		if (!mentionId || mentionId === author.id) return;
		const [ userTradeId, mentionedUserTradeId ] = await getInTrade(
			author.id,
			mentionId
		);
		const embed = createEmbed(author, client);
		if (userTradeId) {
			const tradeQueue = await queue.getTradeQueue(userTradeId);
			if (!tradeQueue) {
				await Promise.all([ queue.delFromQueue(userTradeId), queue.delFromTrade(author.id) ]);
				context.channel?.sendMessage("Unable to process trade. try again later");
				return;
			}
			const tradeActionParams = {
				channel: context.channel,
				args,
				client,
				author,
				tradeQueue,
				tradeId: userTradeId
			};
			if (mentionId === "add") {
				addToTrade(tradeActionParams);
				return;
			} else if (mentionId === "view") {
				viewTrade(tradeActionParams);
				return;
			} else if (mentionId === "cancel") {
				cancelTrade(tradeActionParams);
				return;
			} else if (mentionId === "confirm") {
				confirmTrade(tradeActionParams);
				return;
			}

			embed
				.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription(
					`Summoner **${author.username}** You are currently in trade. ` +
					"Use ``tr cancel/confirm`` to cancel/confirm the trade"
				)
				.setHideConsoleButtons(true);
			context.channel?.sendMessage(embed);
			return;
		}
		const mentionedUser = await getUser({
			user_tag: mentionId,
			is_banned: false,
		});
		if (!mentionedUser) return;
		if (mentionedUser.level < REQUIRED_TRADE_LEVEL) {
			context.channel?.sendMessage(
				`Summoner **${mentionedUser.username}**, must be atleast level __${REQUIRED_TRADE_LEVEL}__ to trade`
			);
			return;
		}
		if (mentionedUserTradeId) {
			embed
				.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription(
					`Summoner **${mentionedUser.username}** is currently in trade. ` +
				"Use ``tr cancel/confirm`` to cancel/confirm the trade"
				)
				.setHideConsoleButtons(true);
			context.channel?.sendMessage(embed);
			return;	
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.level < REQUIRED_TRADE_LEVEL) {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, you must be atleast level __${REQUIRED_TRADE_LEVEL}__ to trade`
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
				userId: user.id,
				mentionUserId: mentionedUser.id,
			},
		};
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			mentionId,
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
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.trades.trade: ERROR",
			err
		);
		return;
	}
};
