import { AuthorProps, ChannelProp, ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, EmbedFieldData, Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { clientSidePagination } from "helpers/pagination";
import loggers from "loggers";
import { clone } from "utility";
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
	const array = clone(params.array);
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
	try {
		const filter = clone(PAGE_FILTER);
		const totalCount = array.length;
		const totalPages = Math.ceil(totalCount / filter.perPage);
		let embed = createEmbed(author);
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
					}).setHideConsoleButtons(true);
					if (options.filepath) {
						const attachment = createAttachment(options.filepath, "thumbnail.jpeg");
						embed.setThumbnail("attachment://thumbnail.jpeg")
							.attachFiles([ attachment ]);
					}
				} else {
					embed.setDescription("No data available");
				}
				if (opts?.isDelete && sentMessage) {
					sentMessage.deleteMessage();
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
		if (!buttons) return;

		embed.setButtons(buttons);

		const msg = await channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
	} catch (err) {
		loggers.error("api.controllers.PagingController.pageFunc: ERROR", err);
		throw err;
	}
};
