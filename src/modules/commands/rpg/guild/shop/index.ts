import { BaseProps } from "@customTypes/command";
import { getGuildMarket } from "api/controllers/GuildMarketsController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { GUILD_MARKET_IDS, PAGE_FILTER } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createGuildMarketItemList } from "helpers/embedLists/guildItems";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { buyItem } from "./buy";

export const itemMarket = async ({ context, client, args, options }: BaseProps) => {
	try { 
		const author = options.author;
		const cmd = args.shift();
		if (cmd?.toLowerCase() === "buy") {
			buyItem({
				context,
				client,
				args,
				options 
			});
			return;
		}
		let embed = createEmbed();
		let sentMessage: Message;
		const filter = clone(PAGE_FILTER);
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			{ ids: GUILD_MARKET_IDS },
			filter,
			getGuildMarket,
			(data, opts) => {
				if (data) {
					const list = createGuildMarketItemList(data.data, data.metadata.currentPage, data.metadata.perPage);
					embed = createEmbedList({
						author,
						list,
						totalCount: data.metadata.totalCount,
						totalPages: data.metadata.totalPages,
						currentPage: data.metadata.currentPage,
						client,
						pageCount: data.data.length,
						title: "Guild Market",
						description: "All the items on the Guild Global Market are shown below.",
						pageName: "items"
					});
				} else {
					embed.setDescription("No items available");
				}
				if (opts?.isDelete && sentMessage) {
					sentMessage.deleteMessage();
				}
				if (opts?.isEdit) {
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
		loggers.error("modules.commands.rpg.guild.shop.itemMarket: ERROR", err);
		return;
	}
};