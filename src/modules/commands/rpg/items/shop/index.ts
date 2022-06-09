import { FilterProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { ItemProps } from "@customTypes/items";
import { getItems } from "api/controllers/ItemsController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createItemList } from "helpers/embedLists/items";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { purchaseItem } from "./actions";

export const itemshop = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const shop = args[0];
		if (shop === "buy") {
			args.shift();
			purchaseItem({
				author,
				client,
				args,
				context
			});
			return;
		}
		const filter = clone(PAGE_FILTER);
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0]);
			delete params.page;
		}
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await paginatorInteraction<
      Pick<FilterProps, "name">,
      ItemProps[]
    >(context.channel, author.id, params, filter, getItems, (data, options) => {
    	if (data) {
    		const list = createItemList(
    			data.data,
    			data.metadata.currentPage,
    			data.metadata.perPage,
    			{ isMarket: true }
    		);
    		embed = createEmbedList({
    			author,
    			list,
    			currentPage: data.metadata.currentPage,
    			totalPages: data.metadata.totalPages,
    			totalCount: data.metadata.totalCount,
    			client,
    			pageCount: data.data.length,
    			pageName: "Items",
    			description:
            "All Items on the market that match your " +
            "requirements are shown below.",
    			title: "Items",
    		});
    	}
    	if (options?.isDelete && sentMessage) {
    		sentMessage.deleteMessage();
    	}
    	if (options?.isEdit) {
    		sentMessage.editMessage(embed);
    	}
    });
		if (!buttons) return;

		embed.setButtons(buttons);

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.items.shop.itemshop(): something went wrong",
			err
		);
		return;
	}
};
