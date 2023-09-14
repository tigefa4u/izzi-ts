import { FilterProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getAllCustomServerCards } from "api/controllers/CustomServerCardsController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { IZZI_WEBSITE } from "environment";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createServerCustomCardList } from "helpers/embedLists/serverCustomCards";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

export const showCustomDex = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const { author } = options;
		if (!context.guild?.id) return;
		const params = fetchParamsFromArgs<FilterProps & { guild_id: string }>(
			args
		);
		const filter = clone(PAGE_FILTER);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0]);
			delete params.page;
		}
		params.guild_id = context.guild.id;
		let embed = createEmbed()
			.setDescription(
				"No data available. To add custom cards to your server please submit card details at " +
          `${IZZI_WEBSITE}/@me/customcard`
			)
			.setHideConsoleButtons(true);
		let sentMessage: Message;

		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			params,
			filter,
			getAllCustomServerCards,
			(data, opts) => {
				if (data) {
					const list = createServerCustomCardList(
						data.data,
						data.metadata.currentPage,
						data.metadata.perPage
					);
					embed = createEmbedList({
						author,
						list,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages,
						totalCount: data.metadata.totalCount,
						title: `${context.guild?.name || "Server"} Custom Dex`,
						description:
              "All custom cards available on this server are shown below",
						pageName: "Dex",
						client,
						pageCount: data.data.length,
					}).setHideConsoleButtons(true);
				}
				if (opts?.isEdit) {
					sentMessage.editMessage(embed);
				} else if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
			}
		);
		if (buttons) {
			embed.setButtons(buttons);
		}

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("guildEvents.customCards.dex.showCustomDex: ERROR", err);
		return;
	}
};
