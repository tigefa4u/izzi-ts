import { BaseProps } from "@customTypes/command";
import { delGuildMember, getGuildMember } from "api/controllers/GuildMembersController";
import { updateGuild } from "api/controllers/GuildsController";
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
		const mentionedUser = await getRPGUser({ user_tag: mentionId }, {
			cached: true,
			ignoreBannedUser: true 
		});
		if (!mentionedUser) {
			context.channel?.sendMessage("We are not able to find this user, please contact support");
			return;
		}
		loggers.info("kickFromGuild: member being kicked by admin: " + author.id);
		loggers.info("kickFromGuild: mentioned user found: ", mentionedUser);
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
		loggers.info("kickFromGuild: guild details: ", validGuild);
		const member = await getGuildMember({ user_id: mentionedUser.id });
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE);
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
		loggers.info("Member is being kicked memberId: " + mentionId);
		validGuild.guild.points = validGuild.guild.points - member.supporter_points;
		await Promise.all([
			delGuildMember({ id: member.id }),
			updateGuild({ guild_id: validGuild.guild.guild_id }, { points: validGuild.guild.points })
		]);
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Member **${mentionedUser.username}** has been kicked from your Guild!`);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.guild.dangerZone.kick.kickFromGuild: ERROR", err);
		return;
	}
};