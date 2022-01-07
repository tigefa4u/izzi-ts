import { FilterProps } from "@customTypes";
import { CharacterDetailsProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { getDex } from "api/controllers/CharactersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createDexList } from "helpers/embedLists/xendex";
import loggers from "loggers";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

export const dex = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options?.author;
		if (!author) return;
		const filter = PAGE_FILTER;
		const params = fetchParamsFromArgs(args);
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = 
			await paginatorInteraction<Pick<FilterProps, "abilityname" | "series">, CharacterDetailsProps[]>(
				context.channel,
				author.id,
				params,
				filter,
				getDex,
				(data, options) => {
					if (data) {
						const list = createDexList(data.data, data.metadata.currentPage, data.metadata.perPage);
						embed = createEmbedList({
							author,
							list,
							currentPage: data.metadata.currentPage,
							totalPages: data.metadata.totalPages,
							totalCount: data.metadata.totalCount,
							client,
							pageCount: data.data.length,
							title: "XenDex",
							description: "All the cards on The XenDex that match your requirements are shown below.",
							pageName: "Dex"
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
		if (buttons) {
			embed.setButtons(buttons);
		}

		context.channel.sendMessage(embed).then((msg) => {
			sentMessage = msg;
		});
		return;
	} catch (err) {
		loggers.error(
			"module.commands.rpg.xendex.dex(): something went wrong",
			err
		);
		return;
	}
};
