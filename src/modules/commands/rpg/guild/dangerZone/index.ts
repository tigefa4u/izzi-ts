import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { delGuildMember } from "api/controllers/GuildMembersController";
import { disbandAndBackupGuild, updateGuild } from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { verifyMemberPermissions } from "..";

async function validateAndDisbandGuild(
	params: ConfirmationInteractionParams<{
    context: BaseProps["context"];
    user_id: number;
  }>,
	options?: ConfirmationInteractionOptions
) {
	if (!params.extras?.context || !params.extras.user_id) return;
	const validGuild = await verifyMemberPermissions({
		context: params.extras.context,
		author: params.author,
		params: [ "is_leader" ],
		isAdmin: true,
		isOriginServer: false,
		extras: { user_id: params.extras.user_id },
	});
	if (!validGuild) return;
	if (options?.isConfirm) {
		await disbandAndBackupGuild({ guild: validGuild.guild });
		params.extras.context.channel?.sendMessage(
			"You have disbanded your guild."
		);
		return;
	}
	return validGuild;
}

export const disbandGuild = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "disband-guild";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const params = {
			channel: context.channel,
			author,
			client,
			extras: {
				user_id: user.id,
				context,
			},
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndDisbandGuild,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setTitle("DISBAND GUILD")
						.setDescription(
							"Are you sure you want to disband your guild? " +
                            "You will lose access to bonus stats and guild items!"
						);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.dangerZone.disbandGuild: ERROR",
			err
		);
		return;
	}
};

async function validateAndLeaveGuild(
	params: ConfirmationInteractionParams<{
    context: BaseProps["context"];
    user_id: number;
  }>,
	options?: ConfirmationInteractionOptions
) {
	if (!params.extras?.context || !params.extras.user_id) return;
	const validGuild = await verifyMemberPermissions({
		context: params.extras.context,
		author: params.author,
		params: [],
		isAdmin: false,
		isOriginServer: false,
		extras: { user_id: params.extras.user_id },
	});
	if (!validGuild) return;
	if (validGuild.member.is_leader) {
		params.extras.context.channel?.sendMessage("The Leader cannot leave the Guild!");
		return;
	}
	if (options?.isConfirm) {
		validGuild.guild.points = validGuild.guild.points - validGuild.member.supporter_points;
		await Promise.all([
			delGuildMember({ id: validGuild.member.id }),
			updateGuild({ guild_id: validGuild.guild.guild_id }, { points: validGuild.guild.points })
		]);
		params.extras.context.channel?.sendMessage(
			"You have left your guild."
		);
		await setCooldown(params.author.id, "leave-guild", 60 * 60 * 23);
		return;
	}
	return validGuild;
}

export const leaveGuild = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "leave-guild";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const params = {
			channel: context.channel,
			author,
			client,
			extras: {
				user_id: user.id,
				context,
			},
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndLeaveGuild,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setDescription(
							"Are you sure you want to leave your guild? " +
                            "You will lose access to bonus stats and guild items! " +
							"And your guild will lose reputation points!"
						);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.dangerZone.leaveGuild: ERROR",
			err
		);
		return;
	}
};