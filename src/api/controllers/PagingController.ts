import { AuthorProps, ChannelProp, ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { createEmbed } from "commons/embeds";
import { Client, EmbedFieldData, Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { clientSidePagination } from "helpers/pagination";
import cloneDeep from "lodash/cloneDeep";
import { paginatorInteraction } from "utility/ButtonInteractions";

type P = {
  totalCount: number;
  totalPages: number;
};
type T<G> = {
  array: G[];
};
async function paginatorFunc<G>(
	params: T<G>,
	filter: PageProps,
	options?: P
): Promise<ResponseWithPagination<G[]> | undefined> {
	if (!options) return;
	const array = cloneDeep(params.array);
	const result = clientSidePagination(
		array,
		filter.currentPage,
		filter.perPage
	);
	return {
		data: result,
		metadata: {
			...filter,
			...options,
		},
	};
}

type O = {
	list: EmbedFieldData[] | [];
	title: string;
	description: string;
	pageName: string;
	client: Client;
	filepath?: string;
}
export const pageFunc = async <T>(
	array: T[],
	channel: ChannelProp,
	author: AuthorProps,
	options: O
) => {
	const filter = PAGE_FILTER;
	const totalCount = array.length;
	const totalPages = Math.ceil(totalCount / filter.perPage);
	let embed = createEmbed();
	let sentMessage: Message;
	const buttons = await paginatorInteraction<{ array: T[] }, T[], P>(
		channel,
		author.id,
		{ array },
		filter,
		paginatorFunc,
		(data, opts) => {
			if (data) {
				const desc = `${options.description}\n\n${data.data.map((i) => i).join("")}`;
				embed = createEmbedList({
					author,
					list: options.list,
					currentPage: data.metadata.currentPage,
					totalPages,
					totalCount,
					title: options.title,
					description: desc,
					pageName: options.pageName,
					pageCount: data.data.length,
					client: options.client
				});
				if (options.filepath) {
					embed.setThumbnail(options.filepath);
				}
			}
			if (opts?.isDelete && sentMessage) {
				sentMessage.delete();
			}
			if (opts?.isEdit) {
				sentMessage.editMessage(embed);
			}
		},
		{
			totalCount,
			totalPages,
		}
	);
	if (buttons) {
		embed.setButtons(buttons);
	}

	channel?.sendMessage(embed).then((msg) => {
		sentMessage = msg;
	});
};
