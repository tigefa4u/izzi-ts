import { AuthorProps } from "@customTypes";
import { createEmbed } from "commons/embeds";
import { Client, EmbedFieldData } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";

type DexEmbedProps = {
  author: AuthorProps;
  list: EmbedFieldData[] | [];
  client: Client;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageCount: number;
  title: string;
  description: string;
  pageName: string;
};

function calcTotalPageCount(
	count: number,
	currentPage: number,
	perPage: number
) {
	return count + (currentPage - 1) * perPage;
}

export const createEmbedList = ({
	author,
	list,
	currentPage,
	totalPages,
	totalCount,
	client,
	pageCount,
	title,
	description,
	pageName,
}: DexEmbedProps) => {
	const embed = createEmbed();
	embed
		.setTitle(title)
		.setDescription(description)
		.setAuthor({
			name: author.username,
			iconURL: author.displayAvatarURL(),
		})
		.setThumbnail(client.user?.displayAvatarURL() || "")
		.setFooter({
			text: `Page: ${
				currentPage > totalPages ? 0 : currentPage
			} / ${totalPages} | ${pageName}: ${
				totalCount === 0
					? 0
					: calcTotalPageCount(pageCount, currentPage, PAGE_FILTER.perPage)
			} / ${totalCount}`,
		});
	if (list.length > 0) embed.addFields(list);
	return embed;
};
