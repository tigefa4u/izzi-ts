import { BaseProps } from "@customTypes/command";
import { getAllGuildItems } from "api/controllers/GuildItemsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createGuildItemList } from "helpers/embedLists/guildItems";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { verifyMemberPermissions } from "..";

export const guildItems = async ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [],
			isOriginServer: true,
			isAdmin: false,
			extras: { user_id: user.id }
		});
		if (!validGuild) return;
		const filter = clone(PAGE_FILTER);
		const params = { guild_id: validGuild.guild.id };
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			params,
			filter,
			getAllGuildItems,
			(data, opts) => {
				if (data) {
					const list = createGuildItemList(data.data, data.metadata.currentPage, data.metadata.perPage);
					embed = createEmbedList({
						author,
						list,
						totalCount: data.metadata.totalCount,
						totalPages: data.metadata.totalPages,
						currentPage: data.metadata.currentPage,
						client,
						pageCount: data.data.length,
						title: "Guild Items",
						description: "All the items in your guild are shown below.",
						pageName: "items"
					});
				} else {
					embed.setDescription("Your guild currently has no items. Purchase items from the Guild Market!");
				}
				if (opts?.isDelete && sentMessage) {
					sentMessage.delete();
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
		loggers.error(
			"modules.commands.rpg.guild.items.guildItems(): something went wrong",
			err
		);
		return;
	}
};