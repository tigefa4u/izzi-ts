import { BaseProps } from "@customTypes/command";
import { delGuildMember, getGuildMember } from "api/controllers/GuildMembersController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { getIdFromMentionedString } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { verifyMemberPermissions } from "..";

export const kickFromGuild = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const id = args.shift();
		if (!id) return;
		const mentionId = getIdFromMentionedString(id);
		const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
		if (!mentionedUser) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader", "is_vice_leader" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id }
		});
		if (!validGuild) return;
		const member = await getGuildMember({ user_id: mentionedUser.id });
		const embed = createEmbed()
			.setTitle(DEFAULT_ERROR_TITLE)
			.setAuthor({
				name: author.username,
				iconURL: author.displayAvatarURL()
			})
			.setThumbnail(client.user?.displayAvatarURL() || "");
		if (!member || member.guild_id !== validGuild.guild.id) {
			embed.setDescription("This user does not belong to your guild!");
			context.channel?.sendMessage(embed);
			return;
		}
		if (member.is_leader || member.is_vice_leader) {
			embed.setDescription("You cannot kick your vice leader or your leader!");
			context.channel?.sendMessage(embed);
			return;
		}
		await delGuildMember({ id: member.id });
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Member **${mentionedUser.username}** has been kicked from your Guild!`);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.guild.dangerZone.kick.kickFromGuild(): something went wrong", err);
		return;
	}
};