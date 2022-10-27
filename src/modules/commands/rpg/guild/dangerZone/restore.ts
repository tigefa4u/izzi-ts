import { ChannelProp, ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { GuildProps } from "@customTypes/guilds";
import { createGuildMember, getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild, updateGuild } from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { getMemberPermissions } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";

const confirmAndRestoreGuild = async (
	params: ConfirmationInteractionParams<{ userId: number; guild: GuildProps; }>,
	options?: ConfirmationInteractionOptions
) => {
	const userId = params.extras?.userId;
	const guild = params.extras?.guild;
	if (!userId || !guild) return;
	const { author, client } = params;
	const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
	const guildMember = await getGuildMember({ user_id: userId });
	if (!guildMember) {
		embed.setDescription(`Summoner **${author.username}**, You are currently not in a guild.`);
		params.channel?.sendMessage(embed);
		return;
	}
	if (guildMember?.guild_id !== guild.id) {
		embed.setDescription(
			`Summoner **${author.username}**, You are already in a different guild.`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (!guildMember.is_leader) {
		embed.setDescription(`Summoner **${author.username}**, Only the guild leader can use this command`);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		await restoreGuildData({
			guild,
			author,
			client,
			channel: params.channel,
		});
		return;
	}
	return true;
};

const processRestoreGuild = async ({
	context,
	client,
	options,
	userId,
	guild
}: Pick<BaseProps, "context" | "options" | "client"> & { userId: number; guild: GuildProps; }) => {
	const author = options.author;
	let sentMessage: Message;

	const embed = createConfirmationEmbed(author, client).setTitle("Guild Restoration :exclamation:")
		.setDescription("Are you sure you want to restore previous stats? This action cannot be reverted. " +
                    "**NOTE: Guild Members and Guild Items cannot be restored.**");

	const buttons = await confirmationInteraction(
		context.channel,
		author.id,
		{
			client,
			author,
			channel: context.channel,
			extras: {
				userId,
				guild
			}
		},
		confirmAndRestoreGuild,
		(data, opts) => {
			if (opts?.isDelete) {
				sentMessage.deleteMessage();
			}
		}
	);

	if (!buttons) return;

	embed.setHideConsoleButtons(true);
	embed.setButtons(buttons);

	const msg = await context.channel?.sendMessage(embed);
	if (msg) {
		sentMessage = msg;
	}
	return;
};

type R = {
    guild: GuildProps;
    author: BaseProps["options"]["author"];
    client: BaseProps["client"];
    channel: ChannelProp;
}
const restoreGuildData = async ({ guild, author, client, channel }: R) => {
	const guildMetadata = guild.metadata as any;
	const embed = createEmbed(author, client).setTitle(DEFAULT_SUCCESS_TITLE)
		.setDescription("Your guild stats and gold has been successfully restored. " +
        "**NOTE: Guild Members and Items cannot be restored.**");
	await updateGuild({ guild_id: guild.guild_id }, {
		guild_level: guildMetadata.guild_level || 1,
		guild_stats: guildMetadata.guild_stats,
		guild_name: guildMetadata.guild_name,
		item_stats: guildMetadata.item_stats,
		gold: guildMetadata.gold,
		max_members: guildMetadata.max_members || 15
	});

	channel?.sendMessage(embed);
	return;
};

export const restoreGuild = async ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const guildId = context.guild?.id;
		if (!guildId) return;
		const isAdmin = await getMemberPermissions(context, author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		if (!isAdmin) {
			context.channel?.sendMessage(
				"You are not allowed to execute this command! :x:"
			);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;

		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const guild = await getGuild({ guild_id: guildId });
		if (!guild) {
			context.channel?.sendMessage(
				"Oh no, Something horrible has happened! please contact support"
			);
			return;
		}
		if (guild.is_banned) {
			context.channel?.sendMessage("Your guild has been banned." +
            `\n**[Reason]: ${guild.ban_reason || "Guild Suspended"}**`);
			return;
		}
		if (!guild.metadata || Object.keys(guild.metadata).length <= 0) {
			embed.setDescription("Your guild does not have a backup to restore.");
			context.channel?.sendMessage(embed);
			return;
		}
		processRestoreGuild({
			client,
			options,
			context,
			userId: user.id,
			guild
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.dangerZone.restoreGuild: ERROR",
			err
		);
		return;
	}
};
