import { ChangeLogProps } from "@customTypes/changelogs";
import { BaseProps } from "@customTypes/command";
import { PageProps } from "@customTypes/pagination";
import { getChangeLogs } from "api/controllers/ChangeLogsController";
import { paginatorFunc } from "api/controllers/PagingController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { IZZI_WEBSITE } from "environment";
import { DOT } from "helpers/constants/constants";
import loggers from "loggers";
import { clone, toLocaleDate } from "utility";
import { customButtonInteraction, paginatorInteraction, } from "utility/ButtonInteractions";

export const viewChangeLogs = async ({
	context,
	options,
	client,
}: BaseProps) => {
	try {
		const author = options.author;

		const result = await getChangeLogs();
		if (!result) {
			context.channel?.sendMessage(
				"There are currently no change logs available, come back later."
			);
			return;
		}

		let embed = createEmbed(author, client)
			.setTitle(`${emoji.crossedswords} Change Logs ${emoji.crossedswords}`)
			.setDescription(
				"View a detailed description of Patch notes and updates on izzi."
			);

		const filter: PageProps = clone({
			currentPage: 1,
			perPage: 1,
		});

		let sentMessage: Message;
		const buttons = await paginatorInteraction<
      { array: ChangeLogProps[] },
      ChangeLogProps[],
      { totalCount: number; totalPages: number }
    >(
    	context.channel,
    	author.id,
    	{ array: result },
    	filter,
    	paginatorFunc,
    	(data, options) => {
    		if (data) {
    			const res = data.data[0];
    			embed = createEmbed(author, client)
    				.setTitle(
    					`${emoji.crossedswords} Change Logs ${emoji.crossedswords}`
    				)
    				.setDescription(
    					`**${res.name} ${DOT} ${toLocaleDate(
    						new Date(res.created_at).getTime()
    					)}**` + `\n\n${res.description}`
    				)
    				.setHideConsoleButtons(true)
    				.setFooter({
    					text: `Page ${data.metadata.currentPage} / ${result.length}`,
    					iconURL: author.displayAvatarURL()
    				})
    				.setTimestamp();
    		}
    		if (options?.isDelete && sentMessage) {
    			sentMessage.deleteMessage();
    		} else if (options?.isEdit && sentMessage) {
    			sentMessage.editMessage(embed);
    		}
    	},
    	{
    		totalCount: result.length,
    		totalPages: result.length,
    	}
    );

		if (!buttons) return;
		const customButton = customButtonInteraction(
			context.channel,
			[ {
				label: "Change Logs",
				params: { id: "change-log" },
				url: `${IZZI_WEBSITE}/changelogs`,
				style: "LINK"
			} ],
			author.id,
			() => {
				//
			},
			() => {
				//
			},
			true
		);
		if (customButton) {
			embed.setButtons(customButton);
		}
		embed.buttons.setComponents(
			...embed.buttons.components,
			...buttons.components
		);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.basic.changelogs.viewChangeLogs: ERROR",
			err
		);
		return;
	}
};
