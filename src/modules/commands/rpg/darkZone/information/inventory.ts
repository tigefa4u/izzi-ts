import { FilterProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getDzInventory } from "api/controllers/DarkZoneInventoryController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createDarkZoneEmbedList } from "helpers/embedLists/darkZoneInventory";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { safeParseInventoryParams } from "../../collections";

export const viewDzInventory = async ({ client, context, args, options }: BaseProps) => {
	try {
		const { author } = options;
		let params = fetchParamsFromArgs<FilterProps & { user_tag: string; }>(args);
		params = safeParseInventoryParams(params);
		Object.assign(params, {
			user_tag: author.id,
			isFetchSeries: true 
		});
		let embed = createEmbed().setHideConsoleButtons(true);
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
			getDzInventory,
			(data, options) => {
				if (data) {
					const list = createDarkZoneEmbedList(data.data);
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
          "All Cards in your Dark Zone inventory that match your " +
          "requirements are shown below.",
						title: "Inventory",
					}).setHideConsoleButtons(true);
				} else {
					embed.setDescription(
						"You currently have no cards. Start " +
                        "claiming cards to go on your journey in the Xenverse!"
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
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("viewDzInventory: ERROR", err);
		return;
	}
};