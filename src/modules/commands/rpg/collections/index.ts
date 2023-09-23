import { FilterProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getAllCollections, getTotalFodders } from "api/controllers/CollectionsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { numericWithComma } from "helpers";
import { CONSOLE_BUTTONS, PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createCollectionList } from "helpers/embedLists/collections";
import { RanksMetaProps } from "helpers/helperTypes";
import { ranksMeta } from "helpers/rankConstants";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { clone } from "utility";
import { customButtonInteraction, paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { getSortCache } from "../sorting/sortCache";
import { lockFodders } from "./actions/lock";
import { unlockFodders } from "./actions/unlock";
import { viewLockedFodders } from "./actions/view";
import { selectCard } from "./select";
import { subcommands } from "./subcommands";

function getRankId(rank_id: string) {
	const keys = Object.keys(ranksMeta);
	const index = keys.findIndex((r) => r.includes(rank_id));
	if (index >= 0) {
		return ranksMeta[keys[index] as keyof RanksMetaProps].rank_id;
	}
}

function parseRankId(rank_id: string | string[]) {
	if (typeof rank_id === "string") {
		return getRankId(rank_id);
	} else if (typeof rank_id === "object") {
		return rank_id.map((rid) => getRankId(rid));
	}
}

function safeParseParams(params: FilterProps & { user_id: number }) {
	if (params.rank) {
		const ids = parseRankId(params.rank);
		if (ids) {
			if (typeof ids === "object") {
				params.rank_ids = ids.filter(Boolean).map(Number);
			} else {
				params.rank_ids = ids;
			}
		}
	}
	if (typeof params.is_favorite === "object") {
		params.is_favorite = true;
	} else {
		delete params.is_favorite;
	}
	if (typeof params.is_on_market === "object") {
		params.is_on_market = true;
	} else {
		delete params.is_on_market;
	}
	if (typeof params.is_on_cooldown === "object") {
		params.is_on_cooldown = true;
	} else {
		delete params.is_on_cooldown;
	}

	delete params.rank;

	return params;
}

export const cardCollection = async ({
	client,
	context,
	args,
	options,
	isGuide
}: BaseProps & { isGuide?: boolean; }) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const cmd = filterSubCommands(args[0], subcommands);
		const subcommandParams = {
			client,
			context,
			args,
			options
		};
		if (cmd === "fodders") {
			const fodderCount = await getTotalFodders(user.id);
			context.channel?.sendMessage(`Summoner **${author.username}**, you currently have ` +
			`__${numericWithComma(((fodderCount || [])[0] || {}).sum || 0)}x__ Platinum Fodders in Total.`);
			return;
		} else if (cmd === "lock") {
			lockFodders(subcommandParams);
			return;
		} else if (cmd === "unlock") {
			unlockFodders(subcommandParams);
			return;
		} else if (cmd === "viewlock") {
			viewLockedFodders(subcommandParams);
			return;
		}
		let params = <FilterProps & { user_id: number; }>fetchParamsFromArgs(args);
		params = safeParseParams(params);
		Object.assign(params, {
			user_id: user.id,
			isFetchSeries: true 
		});
		let embed = createEmbed();
		let sentMessage: Message;
		const filter = clone(PAGE_FILTER);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0]);
			delete params.page;
		}
		if (!isGuide) {
			const sort = await getSortCache(author.id);
			const buttons = await paginatorInteraction(
				context.channel,
				author.id,
				params,
				filter,
				getAllCollections,
				(data, options) => {
					if (data) {
						const list = createCollectionList(data.data);
						embed = createEmbedList({
							author,
							list,
							currentPage: data.metadata.currentPage,
							totalPages: data.metadata.totalPages,
							totalCount: data.metadata.totalCount,
							client,
							pageCount: data.data.length,
							pageName: "Inventory",
							description:
              "All Cards in your inventory that match your " +
              "requirements are shown below.",
							title: "Inventory",
						}).setHideConsoleButtons(true);
					} else {
						embed.setDescription(
							"You currently have no collections. Start " +
							"claiming cards to go on your journey in the Xenverse!"
						);
					}
					if (options?.isDelete && sentMessage) {
						sentMessage.deleteMessage();
					}
					if (options?.isEdit) {
						sentMessage.editMessage(embed);
					}
				},
				sort
			);
			if (!buttons) return;

			embed.setButtons(buttons);
		} else {
			const result = await getAllCollections({ user_id: user.id }, {
				currentPage: 1,
				perPage: 1,
			});
			if (!result?.data || result.data.length <= 0) {
				embed.setDescription("You do not have any cards in your inventory. " +
				"Claim cards to be able to use them throughout your journey.")
					.setHideConsoleButtons(true);
				context.channel?.sendMessage(embed);
				return;
			}
			const list = createCollectionList(result.data);
			embed = createEmbedList({
				author,
				list,
				currentPage: 1,
				totalPages: 1,
				totalCount: 1,
				client,
				pageCount: 1,
				pageName: "Inventory",
				description:
					"**Yay, Welldone Summoner. Now select the card below " +
					"by typing `iz select 1` or click on the button.**",
				title: "Inventory",
			}).setHideConsoleButtons(true);

			const buttons = customButtonInteraction(
				context.channel,
				[
					{
						label: CONSOLE_BUTTONS.SELECT_CARD.label,
						params: { id: CONSOLE_BUTTONS.SELECT_CARD.id }
					},
				],
				author.id,
				({ id }) => {
					if (id === CONSOLE_BUTTONS.SELECT_CARD.id) {
						selectCard({
							client,
							context,
							args: [ "1" ],
							options,
						});
					}
					return;
				},
				() => {
					return;
				},
				true,
				11
			);
			if (!buttons) return;
			embed.setButtons(buttons);
			context.channel?.sendMessage(embed);
			return;
		}

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collections.cardCollection: sommething went wrong",
			err
		);
		return;
	}
};
