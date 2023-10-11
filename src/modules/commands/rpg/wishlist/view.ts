import { FilterProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getRPGUser } from "api/controllers/UsersController";
import { getWishlist } from "api/controllers/WishlistsContorller";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { getIdFromMentionedString } from "helpers";
import { PAGE_FILTER } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createWishlistEmbedList } from "helpers/embedLists/wishlist";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

export const viewWishlist = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		let mentionId = author.id;
		const clonedArgs = clone(args);
		const params = <FilterProps>fetchParamsFromArgs(clonedArgs);
		const mentionedUserId = getIdFromMentionedString(args.shift());
		if (mentionedUserId !== "") {
			const mentionedUser = await getRPGUser({ user_tag: mentionedUserId }, { cached: true });
			if (mentionedUser) {
				mentionId = mentionedUserId;
			}
		}
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
			{
				user_tag: mentionId,
				name: params.name,
				// is_skin: true
			},
			filter,
			getWishlist,
			(data, options) => {
				if (data) {
					const list = createWishlistEmbedList(
						data.data,
						data.metadata.currentPage,
						filter.perPage
					);

					embed = createEmbedList({
						author,
						list,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages,
						totalCount: data.metadata.totalCount,
						client,
						pageCount: data.data.length,
						title: "Skin Wishlist",
						description: "All the items on your wishlist are shown below.",
						pageName: "Wishlist"
					});
				} else {
					embed.setDescription(
						"There are currently no items in your wishlist."
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
		loggers.error("rpg.commands.wishlist.view.viewWishlist: ERROR", err);
		return;
	}
};
