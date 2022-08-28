import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getGuildEventByName } from "api/controllers/GuildEventsController";
import {
	getRaid,
	getUserRaidLobby,
	updateRaid,
} from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message, MessageEmbed } from "discord.js";
import { validateChannelPermissions } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	MAX_RAID_LOBBY_MEMBERS,
	PERMIT_PER_RAID,
	RAID_PING_NAME,
} from "helpers/constants";
import loggers from "loggers";
import {
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import { DMUserViaApi } from "server/pipes/directMessage";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { prepareInitialLobbyMember } from "../../raids";
import { prepareRaidViewEmbed } from "../../raids/actions/view";

type T = {
  user_tag: string;
  raidId: number;
  slotsLeft: number;
};
const validateAndJoinRaid = async ({ user_tag, raidId, slotsLeft }: T) => {
	const currentRaid = await getRaid({ id: raidId });
	const currentLobbyLength = Object.keys(currentRaid?.lobby || {}).length;
	const isLobbyFull = currentLobbyLength >= MAX_RAID_LOBBY_MEMBERS;
	if (
		!currentRaid ||
    isLobbyFull ||
    currentRaid.is_start
	)
		return;
	const user = await getRPGUser({ user_tag });
	if (!user || user.raid_pass < PERMIT_PER_RAID) return;
	const member = await getUserRaidLobby({ user_id: user.id });
	if (member) return;
	const lobbyMember = prepareInitialLobbyMember(
		user.id,
		user_tag,
		user.username,
		user.level,
		Object.keys(currentRaid.lobby).length <= 0 ? true : false
	);
	currentRaid.lobby = {
		...currentRaid.lobby,
		...lobbyMember,
	};
	await updateRaid({ id: currentRaid.id }, { lobby: currentRaid.lobby });
	const message = `You have been successfully recruited to Raid Lobby: ${currentRaid.id}`;
	DMUserViaApi(user_tag, { content: message });
	return;
};

export const raidRecruit = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const guildId = context.guild?.id;
		if (!guildId) return;
		const author = options.author;
		const cd = await getCooldown(author.id, "raidping");
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, "raidping");
			return;
		}
		const guildEvent = await getGuildEventByName({
			guild_id: guildId,
			name: RAID_PING_NAME,
		});
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const channel = guildEvent?.metadata.channel;
		const role = guildEvent?.metadata.role;
		if (!guildEvent || !role || !channel) {
			embed.setDescription(
				`Summoner **${author.username}**, a Raid Ping or Channel ` +
          "has not been set up in this server. " +
          "Use ``iz help ge`` for more info"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const hasPermission = validateChannelPermissions(context, channel);
		if (!hasPermission) {
			embed.setDescription(
				`Permissions missing from channel **<#${channel}>**`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await getUserRaidLobby({ user_id: user.id });
		if (!currentRaid) {
			embed.setDescription(
				`Summoner **${author.username}**, you are currently not in a raid! ` +
          "use ``iz rd spawn`` to spawn one or join an existing raid."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (currentRaid.is_start) {
			embed.setDescription(
				`Summoner **${author.username}**, the raid challenge has already started!`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const member = currentRaid.lobby_member;
		if (!member) return;
		if (!member.is_leader) {
			embed.setDescription(
				`Summoner **${author.username}**, only the lobby leader can use this command.`
			);
			context.channel?.sendMessage(embed);
			return;
		}

		let availableSlots =
      MAX_RAID_LOBBY_MEMBERS - Object.keys(currentRaid.lobby).length;
		const entries = Number(args.shift());
		if (!isNaN(entries) && entries > 0 && entries <= availableSlots) {
			availableSlots = entries;
		}
		const slotsLeft = availableSlots;
		if (slotsLeft <= 0) {
			embed.setDescription(
				`Summoner **${author.username}**, there are currently no slots left in your raid. ` +
          "Use ``iz rd start`` to start the Raid Challenge!"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const sendInChannel = (await context.guild.channels.fetch(
			channel
		)) as BaseProps["context"]["channel"];
		if (!sendInChannel) {
			context.channel?.sendMessage(
				"Could not find configured channel. Please reconfigure."
			);
			return;
		}
		const raidEmbed = await prepareRaidViewEmbed({
			isEvent: currentRaid.is_event,
			currentRaid,
			client,
			author,
			channel: context.channel,
		});
		if (!raidEmbed) return;
		raidEmbed.setFooter({
			text: `Slots Left: ${slotsLeft}`,
			iconURL: author.displayAvatarURL(),
		});
		const buttons = await customButtonInteraction(
			sendInChannel,
			[
				{
					label: "Join",
					params: {
						raidId: currentRaid.id,
						slotsLeft,
					},
				},
			],
			author.id,
			validateAndJoinRaid,
			() => {
				return;
			},
			true,
			11
		);
		if (!buttons) return;
		raidEmbed.setButtons(buttons);
		sendInChannel.sendMessage(raidEmbed);
		const raidPingMessage =
      `All <@&${guildEvent.metadata.role}> Raiders assemble! ` +
      `Summoner **${author.username}** is seeking your help to take down this Raid Boss. ` +
      "Click on **Join** to take on this conquest. " +
      "**NOTE: If the button no longer works, it either means the lobby is full or the raid has expired**";
		sendInChannel.sendMessage(raidPingMessage);
		setCooldown(author.id, "raidping", 60 * 30);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.guildEvents.recruit.raidRecruit(): something went wrong",
			err
		);
		return;
	}
};
