import { RaidActionProps, RaidLobbyProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { HOURS_PER_RAID, PERMIT_PER_RAID } from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { validateCurrentRaid } from "./validateRaid";

export const startRaid = async ({
	context,
	options,
	client,
	isEvent,
}: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(
			user.id,
			author,
			client,
			context.channel
		);
		if (!currentRaid) return;
		if (currentRaid.is_start) {
			context.channel?.sendMessage(
				`The ${isEvent ? "Event" : "Raid"} Challenge has already started! ` +
          `Use \`\`${isEvent ? "ev" : "rd"}\`\` bt to attck the boss!`
			);
			return;
		}
		const lobby = currentRaid.lobby;
		if (!lobby[user.id].is_leader) {
			context.channel?.sendMessage("You are not allowed to use this command.");
			return;
		}
		currentRaid.is_start = true;
		const dt = new Date();
		currentRaid.stats.timestamp = dt.setHours(dt.getHours() + HOURS_PER_RAID);
		const lobbyMembers: (keyof RaidLobbyProps)[] = Object.keys(lobby).map((k) =>
			Number(k)
		);
		const challengingDesc = `The ${
			isEvent ? "Event" : "Raid"
		} Challenge has started! Defeat the boss to win exciting rewards! Use ${
			isEvent ? "ev" : "rd"
		} bt to attack`;
		context.channel?.sendMessage(challengingDesc);
		await Promise.all(
			[ ...lobbyMembers.map(async (l) => {
				const desc = `Summoner **${lobby[l].username}**, ${challengingDesc}`;
				const member = await getRPGUser({ user_tag: lobby[l].user_tag });
				if (member) {
					member.raid_pass = member.raid_pass - PERMIT_PER_RAID;
					await updateRPGUser({ user_tag: member.user_tag }, { raid_pass: member.raid_pass });
				}
				return DMUser(client, desc, lobby[l].user_tag);
			}), updateRaid({ id: currentRaid.id }, {
				stats: currentRaid.stats,
				is_start: currentRaid.is_start 
			}) ]
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.showEnergy(): something went wrong",
			err
		);
		return;
	}
};
