import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
	FilterProps,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getCharacters } from "api/controllers/CharactersController";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import {
	deleteCollection,
	getCollection,
} from "api/controllers/CollectionsController";
import { delFromMarket } from "api/controllers/MarketsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	ALLOWED_CONSUME_CARDS_TO_SHARDS,
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	SHARDS_PER_CARD,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { clone, groupByKey } from "utility";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

async function validateAndProcessShards(
	params: ConfirmationInteractionParams<{
    filteredRowIds: number[];
    user_id: number;
    params: FilterProps;
    idsToExclude: number[];
  }>,
	options?: ConfirmationInteractionOptions
) {
	const rowIds = params.extras?.filteredRowIds;
	const userId = params.extras?.user_id;
	const filterParams = params.extras?.params;
	if (!userId) return;
	let collections;
	if (rowIds && rowIds.length > 0) {
		collections = await getCardInfoByRowNumber({
			row_number: rowIds,
			user_id: userId,
		});
	} else if (filterParams) {
		const collectionParams = {
			user_id: userId,
			rank: filterParams.rank,
			limit: (filterParams.limit as number) || 10,
			is_favorite: false,
			name: filterParams.name,
		};
		if (params.extras?.idsToExclude) {
			Object.assign(collectionParams, { exclude_character_ids: params.extras.idsToExclude, });
		}
		collections = await getCollection(collectionParams);
	}
	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	collections = collections?.filter((c) =>
		ALLOWED_CONSUME_CARDS_TO_SHARDS.includes(c.rank_id)
	);
	if (!collections || collections.length <= 0) {
		embed.setDescription(
			"We could not find the cards you were looking for in your inventory. " +
            "**Note: You can only use Legend and Divine ranked cards**"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const groupedCollections = groupByKey(collections, "rank");
	const groupKeys = Object.keys(groupedCollections);
	let totalShards = 0;
	groupKeys.forEach((key) => {
		totalShards = totalShards + (groupedCollections[key].length * SHARDS_PER_CARD[key]);
	});

	if (options?.isConfirm) {
		const [ user ] = await Promise.all([
			getRPGUser({ user_tag: params.author.id }),
			delFromMarket({ collection_ids: collections.map((c) => c.id) }),
		]);
		await deleteCollection({ ids: collections.map((c) => c.id) });
		if (!user) {
			embed.setDescription(
				"Oh no! something terrible has happened. " +
          "we could not find your account, please contact support!"
			);
			params.channel?.sendMessage(embed);
			return;
		}
		user.shards = user.shards + totalShards;
		await updateRPGUser({ user_tag: user.user_tag }, { shards: user.shards });
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Summoner **${
					params.author.username
				}**, You have successfully consumed ${groupKeys
					.map(
						(k: any) =>
							`__${groupedCollections[k].length}x__ **__${titleCase(
								k
							)}__** ${groupedCollections[k]
								.slice(0, 10)
								.map((c) => `**${titleCase(c.name || "No Name")}**`)
								.join(", ")}`
					)
					.join("\n")} card(s) and received __${totalShards}__ Shards ${
					emoji.shard
				}`
			)
			.setFooter({
				iconURL: params.author.displayAvatarURL(),
				text:
          "The maximum amount of card names listed is 10, if you consume more than 10 different cards, " +
          "the names will not be fully listed",
			});

		params.channel?.sendMessage(embed);
		return;
	}
	return {
		groupedCollections,
		totalShards,
	};
}

export const consumeCardsToShards = async ({
	context,
	options,
	client,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "consume-cards-to-shards";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
		const ids = args[0].split(",");
		const params = <FilterProps>fetchParamsFromArgs(args);
		const filteredRowIds: number[] = [];
		let idsToExclude: number[] = [];
		if (ids) {
			ids.map((d) => {
				const temp = d.trim();
				const num = Number(temp);
				if (!isNaN(num)) {
					filteredRowIds.push(num);
				}
			});
		}
		if (filteredRowIds.length <= 0) {
			if (!params.rank || params.rank.length <= 0) {
				context.channel?.sendMessage("Please specify a valid rank");
				return;
			}
			if (!params.limit) {
				params.limit = 10;
			} else if (typeof params.limit === "object") {
				params.limit = +params.limit[0];
			}
			if (params.limit > 1000) {
				params.limit = 1000;
			}
			if (params.exclude) {
				const characters = await getCharacters({ name: params.exclude });
				if (characters.length > 0) {
					idsToExclude = characters.map((c) => c.id);
				}
			}
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				client,
				channel: context.channel,
				author,
				extras: {
					params,
					filteredRowIds,
					user_id: user.id,
					idsToExclude,
				},
			},
			validateAndProcessShards,
			(data, opts) => {
				if (data) {
					const keys = Object.keys(data.groupedCollections);
					embed = createConfirmationEmbed(author, client).setDescription(
						`Are you sure you want to consume ${keys
							.map(
								(k: any) =>
									`__${data.groupedCollections[k].length}x__ **__${titleCase(
										k
									)}__** ${data.groupedCollections[k]
										.slice(0, 10)
										.map((c) => `**${titleCase(c.name || "No Name")}**`)
										.join(", ")}`
							)
							.join("\n")} card(s) and receive __${data.totalShards}__ Shards ${
							emoji.shard
						}`
					);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed
			.setHideConsoleButtons(true)
			.setButtons(buttons)
			.setFooter({
				iconURL: author.displayAvatarURL(),
				text:
          "The maximum amount of card names listed is 10, if you consume more than 10 different cards, " +
          "the names will not be fully listed",
			});
		setCooldown(author.id, cooldownCommand, 60);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("consumableCards.consumeCardsToShards: ERROR", err);
		return;
	}
};
