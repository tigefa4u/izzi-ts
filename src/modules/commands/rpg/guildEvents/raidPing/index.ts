import { BaseProps } from "@customTypes/command";
import { createGuildEvent, getGuildEventByName, updateGuildEvent } from "api/controllers/GuildEventsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { getMemberPermissions, getMentionedChannel, getMentionedRole, validateChannelPermissions } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, RAID_PING_NAME } from "helpers/constants";
import loggers from "loggers";
import { fetchParamsFromArgs } from "utility/forParams";

export const raidPing = async ({ options, context, args, client }: BaseProps) => {
	try {
		if (!context.guild?.id) return;
		const author = options.author;
		const isAdmin = await getMemberPermissions(context, author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!isAdmin) {
			embed.setDescription("You are not allowed to execute this command! :x:");
			context.channel?.sendMessage(embed);
			return;
		}
		const params = fetchParamsFromArgs<{ channel: string; role: string; }>(args);
		const role = await getMentionedRole(context, params.role[0] || "");
		if (!role) {
			embed.setDescription("Please provide a valid role from your guild izzi can ping.");
			context.channel?.sendMessage(embed);
			return;
		}
		const channel = await getMentionedChannel(context, params.channel[0] || "");
		if (!channel) {
			embed.setDescription("Please provide a valid channel to ping raiders.");
			context.channel?.sendMessage(embed);
			return; 
		}
		const hasChannelPermission = validateChannelPermissions(context, channel.id);
		if (!hasChannelPermission) {
			embed.setDescription("Please provide a channel with valid permissions to ping raiders.");
			context.channel?.sendMessage(embed);
			return;
		}
		const guildEvent = await getGuildEventByName({
			guild_id: context.guild.id,
			name: RAID_PING_NAME
		});
		embed.setTitle(DEFAULT_SUCCESS_TITLE);
		if (guildEvent) {
			guildEvent.metadata = {
				...guildEvent.metadata,
				role: role.id,
				role_name: role.name,
				channel: channel.id,
				channel_name: channel.name
			};
			await updateGuildEvent({ guild_id: context.guild.id }, { metadata: guildEvent.metadata });
			embed.setDescription(`Successfully updated Raid Ping role to **${role.name}** ` +
            `and Channel to **${channel.name}**`);
			context.channel?.sendMessage(embed);
			return;
		}
		const dt = new Date();
		dt.setDate(dt.getDate() + 365);
		await createGuildEvent({
			guild_id: context.guild.id,
			is_start: true,
			is_guild_floor: false,
			metadata: {
				role: role.id,
				role_name: role.name,
				channel: channel.id,
				channel_name: channel.name
			},
			name: RAID_PING_NAME,
			description: `Ping **${role.name}** role in channel **${channel.name}** to recruit raid members.`,
			duration: 365,
			start_date: new Date(),
			end_date: new Date(dt),
			has_ended: false
		});
		embed.setDescription(`Successfully added Raid Ping role **${role.name}** and Channel **${channel.name}**`);
		context.channel?.sendMessage(embed); 
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.guildEvents.raidPing.index(): something went wrong", err);
		return;
	}
};