import { RaidActionProps } from "@customTypes/raids";
import { getRaidLobbies } from "api/controllers/RaidsController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createLobbiesList } from "helpers/embedLists/lobbies";
import loggers from "loggers";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

export const raidLobbies = async ({
	context, options, client, args, isEvent 
}: RaidActionProps) => {
	try {
		const author = options.author;
		const params = fetchParamsFromArgs(args);
		Object.assign(params, { isEvent });
		let embed = createEmbed();
		let sentMessage: Message;
		const filter = PAGE_FILTER;
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			params,
			filter,
			getRaidLobbies,
			(data, options) => {
				if (data) {
					const list = createLobbiesList(data.data, data.metadata.currentPage, data.metadata.perPage);
					embed = createEmbedList({
						author,
						list,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages,
						totalCount: data.metadata.totalCount,
						client,
						pageCount: data.data.length,
						pageName: "Lobbies",
						description:
                            "All lobbies that match your" +
                            "requirements are shown below.",
						title: `${isEvent ? "Event" : "Raid"} Lobbies`,
					});
				}
				if (options?.isDelete && sentMessage) {
					sentMessage.delete();
				}
				if (options?.isEdit) {
					sentMessage.editMessage(embed);
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);

		context.channel?.sendMessage(embed).then((msg) => {
			sentMessage = msg;
		});
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.raidLobbies(): something went wrong", err);
		return;
	}
};