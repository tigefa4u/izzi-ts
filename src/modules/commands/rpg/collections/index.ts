import { FilterProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getAllCollections } from "api/controllers/CollectionsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER, ranksMeta } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createCollectionList } from "helpers/embedLists/collections";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

function getRankId(rank_id: string) {
	const keys = Object.keys(ranksMeta);
	const index = keys.findIndex((r) => r.includes(rank_id));
	if (index >= 0) {
		return ranksMeta[keys[index]].rank_id;
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

	delete params.rank;

	return params;
}

export const cardCollection = async ({
	client,
	context,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		let params = <FilterProps & { user_id: number; }>fetchParamsFromArgs(args);
		params = safeParseParams(params);
		Object.assign(params, { user_id: user.id });
		let embed = createEmbed();
		let sentMessage: Message;
		const filter = clone(PAGE_FILTER);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0]);
			delete params.page;
		}
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
						pageName: "Collection",
						description:
              "All Cards in your inventory that match your" +
              "requirements are shown below.",
						title: "Collections",
					});
				} else {
					embed.setDescription(
						"You currently have no collections. Start claiming cards to go on your journey in the Xenverse!"
					);
				}
				if (options?.isDelete && sentMessage) {
					sentMessage.deleteMessage();
				}
				if (options?.isEdit) {
					sentMessage.editMessage(embed);
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collections.cardCollection(): sommething went wrong",
			err
		);
		return;
	}
};
