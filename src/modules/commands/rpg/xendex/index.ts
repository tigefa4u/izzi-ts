import { FilterProps } from "@customTypes";
import { CharacterDetailsProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { getDex } from "api/controllers/CharactersController";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData, Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createDexList } from "helpers/embedLists/xendex";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { darkZoneDexEmbedList } from "../darkZone/information/dex";

export const dex = async ({
	context, client, options, args, level 
}: BaseProps & { level?: number; }) => {
	try {
		const author = options.author;
		const filter = clone(PAGE_FILTER);
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0]);
			delete params.page;
		}
		if (params.year) {
			params.year = +params.year;
		}
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await paginatorInteraction<
      Pick<FilterProps, "abilityname" | "series" | "type" | "name">,
      CharacterDetailsProps[]
    >(context.channel, author.id, params, filter, getDex, (data, options) => {
    	if (data) {
    		let list: EmbedFieldData[] = [];
    		if (params.isDarkZone) {
    			list = darkZoneDexEmbedList(
    				data.data,
    				data.metadata.currentPage,
    				data.metadata.perPage,
    				level || 1
    			);
    		} else {
    			list = createDexList(
    				data.data,
    				data.metadata.currentPage,
    				data.metadata.perPage
    			);
    		}
    		embed = createEmbedList({
    			author,
    			list,
    			currentPage: data.metadata.currentPage,
    			totalPages: data.metadata.totalPages,
    			totalCount: data.metadata.totalCount,
    			client,
    			pageCount: data.data.length,
    			title: "XenDex",
    			description:
            `All the ${params.isDarkZone ? "Dark Zone" : ""} cards on The ` +
			"XenDex that match your requirements are shown below.",
    			pageName: "Dex",
    		});
    	} else {
    		embed.setDescription("No data available");
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
		loggers.error("module.commands.rpg.xendex.dex: ERROR", err);
		return;
	}
};
