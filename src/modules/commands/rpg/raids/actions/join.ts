import { RaidActionProps } from "@customTypes/raids";
import {
	getRaid,
	getUserRaidLobby,
	updateRaid,
} from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import {
	DEFAULT_ERROR_TITLE,
	HIGH_LEVEL_RAIDS,
	IMMORTAL_RAIDS,
	MAX_RAID_LOBBY_MEMBERS,
	MIN_LEVEL_FOR_HIGH_RAIDS,
	MIN_RAID_USER_LEVEL,
	PERMIT_PER_RAID,
} from "helpers/constants";
import loggers from "loggers";
import { prepareInitialLobbyMember } from "..";
import { prepareRaidViewEmbed } from "./view";

export const joinRaid = async ({
	context,
	options,
	args,
	client,
	isEvent,
}: RaidActionProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (isNaN(id)) return;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;

		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);

		const currentRaid = await getUserRaidLobby({ user_id: user.id });
		if (currentRaid) {
			embed.setDescription(
				`You are already in a ${isEvent ? "Event" : "Raid"} Challenge!`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.raid_pass < PERMIT_PER_RAID) {
			context.channel?.sendMessage(
				`You do not have enough Permit(s) to join a raid __${user.raid_pass} / ${PERMIT_PER_RAID}__`
			);
			return;
		}
		const raid = await getRaid({ id });
		if (!raid) {
			embed.setDescription(
				"The Challenger Lobby you are looking for does not exist."
			);
			context.channel?.sendMessage(embed);
			return;
		} else if (raid.is_private || raid.is_start) {
			embed.setDescription(
				"The Challenger lobby you are trying to join is either " +
          "private or has already started!"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (
			user.level < MIN_RAID_USER_LEVEL &&
      HIGH_LEVEL_RAIDS.includes(raid.stats.difficulty)
		) {
			context.channel?.sendMessage(
				`You must be atleast level __${MIN_RAID_USER_LEVEL}__ ` +
          "to be able to spawn or join __high level(Hard / Immortal)__ Raids."
			);
			return;
		} else if (
			user.level < MIN_LEVEL_FOR_HIGH_RAIDS &&
      IMMORTAL_RAIDS.includes(raid.stats.rawDifficulty) &&
	  !isEvent
		) {
			context.channel?.sendMessage(
				`You must be atleast level __${MIN_LEVEL_FOR_HIGH_RAIDS}__ ` +
          "to be able to spawn or join __Immortal__ Raids."
			);
			return;
		}
		const lobby = raid.lobby;
		if (Object.keys(lobby).length >= MAX_RAID_LOBBY_MEMBERS) {
			embed.setDescription(
				"The Challenger lobby you are trying to join is full!"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		Object.assign(lobby, {
			...prepareInitialLobbyMember(
				user.id,
				user.user_tag,
				user.username,
				user.level,
				Object.keys(lobby).length <= 0 ? true : false
			),
		});

		const [ _, viewEmbed ] = await Promise.all([
			updateRaid({ id: raid.id }, { lobby }),
			prepareRaidViewEmbed({
				isEvent,
				author,
				client,
				channel: context.channel,
				currentRaid: raid,
			}),
		]);
		if (!viewEmbed) return;

		viewEmbed.setTitle(`${isEvent ? "Event" : "Raid"} View`);
		context.channel?.sendMessage(viewEmbed);

		const followUpEmbed = createEmbed(author, client)
			.setTitle(
				`${isEvent ? "Event" : "Raid"} Challenge Accepted ${emoji.welldone}!`
			)
			.setDescription(
				"Summoner, you have successfully joined a Raid Challenge! " +
          "Invite others to join your conquest by using the following command: " +
          `${isEvent ? "ev" : "rd"} join ${raid.id}!`
			)
			.setFooter({
				text: `Lobby Code: ${raid.id}`,
				iconURL: author.displayAvatarURL(),
			});

		context.channel?.sendMessage(followUpEmbed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.joinRaid: ERROR",
			err
		);
		return;
	}
};
