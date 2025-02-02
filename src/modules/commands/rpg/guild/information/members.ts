import { BaseProps } from "@customTypes/command";
import { getAllGuildMembers } from "api/controllers/GuildMembersController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createGuildMemberList } from "helpers/embedLists/guildMembers";
import loggers from "loggers";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { verifyMemberPermissions } from "..";

export const viewMembers = async ({ context, client, options, args }: BaseProps) => {
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
		let page = 1;
		if (args[0] && args[0] === "-pg" && args[1]) {
			page = Number(args[1] || 1);
			if (isNaN(page)) page = 1;
		}
		const thumbnail = context.guild?.iconURL() || client.user?.displayAvatarURL();
		const filter = clone(PAGE_FILTER);
		filter.currentPage = page;
		const params = { guild_id: validGuild.guild.id };
		let embed = createEmbed()
			.setThumbnail(thumbnail || "");
		let sentMessage: Message;
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			params,
			filter,
			getAllGuildMembers,
			(data, opts) => {
				if (data) {
					const list = createGuildMemberList(data.data, data.metadata.currentPage, data.metadata.perPage);
					embed = createEmbedList({
						author,
						list,
						totalCount: data.metadata.totalCount,
						totalPages: data.metadata.totalPages,
						pageCount: data.data.length,
						title: "Clan Members",
						description: "All members of your Clan are shown below.",
						pageName: "members",
						client,
						currentPage: data.metadata.currentPage
					});
				}
				if (opts?.isEdit) {
					sentMessage.editMessage(embed);
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
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
			"modules.commands.rpg.guild.information.members.viewMembers: ERROR",
			err
		);
		return;
	}
};