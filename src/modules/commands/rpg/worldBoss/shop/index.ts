import { BaseProps } from "@customTypes/command";
import { getAllWorldBossForMarket } from "api/controllers/WorldBossController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createWorldBossMarketList } from "helpers/embedLists/worldBossMarket";
import loggers from "loggers";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { buyWorldBossCard } from "./buy";

export const worldBossShop = async ({
	context, client, args, options, command 
}: BaseProps) => {
	try {
		const { author } = options;
		const id = args.shift();
		if (id && Number(id)) {
			buyWorldBossCard({
				context,
				client,
				options,
				args: [ id ],
				command
			});
			return;
		}
		let embed = createEmbed(author, client).setTitle("World Boss Market")
			.setDescription("No cards are available");
		let sentMessage: Message;

		const filter = PAGE_FILTER;
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			{},
			filter,
			getAllWorldBossForMarket,
			(data, opts) => {
				if (data?.data) {
					const list = createWorldBossMarketList(data.data, data.metadata.currentPage, data.metadata.perPage);
					embed = createEmbedList({
						author,
						list,
						title: "World Boss Market",
						description: "All the cards available on the World Boss Market are shown below.",
						totalCount: data.metadata.totalCount,
						pageCount: data.metadata.totalPages,
						pageName: "Shop",
						client,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages
					});
				}
				if (opts?.isDelete) {
					sentMessage?.deleteMessage();
				} else if (opts?.isEdit) {
					sentMessage?.editMessage(embed);
				}
			}
		);
		
		if (buttons) {
			embed.setButtons(buttons);
		}
		embed.setHideConsoleButtons(true);

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("worldboss.shop.worldBossShop: ERROR", err);
		return;
	}
};
