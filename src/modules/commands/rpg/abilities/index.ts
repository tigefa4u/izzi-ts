import { FilterProps } from "@customTypes";
import { AbilityProps } from "@customTypes/abilities";
import { BaseProps } from "@customTypes/command";
import { getAbilities } from "api/controllers/AbilityController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createAbilityList } from "helpers/embedLists/ability";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

export const ability = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const filter = clone(PAGE_FILTER);
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0] || 1);
			delete params.page;
		}
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = 
			await paginatorInteraction<Pick<FilterProps, "name">, AbilityProps[]>(
				context.channel,
				author.id,
				params,
				filter,
				getAbilities,
				(data, options) => {
					if (data) {
						const list = createAbilityList(data.data, data.metadata.currentPage, data.metadata.perPage);
						embed = createEmbedList({
							author,
							list,
							currentPage: data.metadata.currentPage,
							totalPages: data.metadata.totalPages,
							totalCount: data.metadata.totalCount,
							client,
							pageCount: data.data.length,
							pageName: "Ability",
							description: "All Abilities that match your requirements are shown below.",
							title: "Abilities"
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
				},
			);
		if (!buttons) return;

		embed.setButtons(buttons);

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
	} catch (err) {
		loggers.error("modules.commands.rpg.abilities.ability: ERROR", err);
		return;
	}
};