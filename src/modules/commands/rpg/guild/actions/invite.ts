import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	createGuildMember,
	getGuildMember,
} from "api/controllers/GuildMembersController";
import { getRPGUser } from "api/controllers/UsersController";
import { getMemberAndItemCount } from "api/models/Guilds";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { getIdFromMentionedString } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	REACTIONS,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { verifyMemberPermissions } from "..";

async function validateAndInviteMember(
	params: ConfirmationInteractionParams<{
    id: string;
    context: BaseProps["context"];
  }>,
	options?: ConfirmationInteractionOptions
) {
	const id = params.extras?.id;
	const context = params.extras?.context;
	const author = params.author;
	if (!id || !context) return;
	const cd = await getCooldown(id, "leave-guild");
	if (cd) {
		sendCommandCDResponse(params.channel, cd, id, "leave-guild");
		return;
	}
	const mentionedUser = await getRPGUser({ user_tag: id }, { cached: true });
	if (!mentionedUser) return;
	const mentionedMember = await getGuildMember({ user_id: mentionedUser.id });
	const embed = createEmbed().setTitle(DEFAULT_ERROR_TITLE).setAuthor({
		name: author.username,
		iconURL: author.displayAvatarURL(),
	});
	if (mentionedMember) {
		embed.setDescription("This user is already in a guild!");
		context.channel?.sendMessage(embed);
		return;
	}
	const user = await getRPGUser({ user_tag: author.id }, { cached: true });
	if (!user) return;
	const validGuild = await verifyMemberPermissions({
		context,
		author,
		params: [],
		isOriginServer: false,
		isAdmin: false,
		extras: { user_id: user.id },
	});
	if (!validGuild) return;
	const totalCount = await getMemberAndItemCount({ id: validGuild.guild.id });
	const mc = totalCount.filter((t) => t.type === "members")[0]?.count;
	const maxMembers = validGuild.guild.max_members || 15;
	if (mc >= maxMembers) {
		embed.setDescription("You cannot invite anymore players into your guild!");
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		await createGuildMember({
			max_donation: 0,
			donation: 0,
			user_id: mentionedUser.id,
			guild_id: validGuild.guild.id,
			is_leader: false,
			is_vice_leader: false,
		});
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Congratulations ${mentionedUser.username}! ` +
                `You have successfully joined ${validGuild.guild.name}! You will now receive guild bonus stats!`
			);
		params.channel?.sendMessage(embed);
		return;
	}
	return validGuild;
}

export const inviteToGuild = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "invite-to-guild";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		const id = getIdFromMentionedString(args.shift() || "");
		if (!id) return;
		const params = {
			channel: context.channel,
			client,
			author,
			extras: {
				id,
				context,
			},
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			id,
			params,
			validateAndInviteMember,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client).setDescription(
						`Summoner ${author.username} has invited you to their guild! ` +
              `React with ${REACTIONS.confirm.emoji} to accept or ${REACTIONS.cancel.emoji} to decline!`
					);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.delete();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand, 60);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.invite.inviteToGuild(): something went wrong",
			err
		);
		return;
	}
};
