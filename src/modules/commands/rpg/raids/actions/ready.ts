import { RaidActionProps, RaidLobbyProps } from "@customTypes/raids";
import { updateLobby, updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { validateCurrentRaid } from "./validateRaid";

export const memberReady = async ({
	context,
	client,
	options,
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
				`${isEvent ? "Event" : "Raid"} challenge has already started! Use \`\`${
					isEvent ? "ev" : "rd"
				} bt\`\` to attack the boss!`
			);
			return;
		}
		const lobby = currentRaid.lobby;
		const lobbyMembers: (keyof RaidLobbyProps)[] = Object.keys(lobby).map((k) => Number(k));
		const leaderId = lobbyMembers.filter((l) => lobby[l].is_leader)[0];
		if (!leaderId) {
			throw new Error("Lobby leader not found for raid: " + currentRaid.id);
		}
		const member = currentRaid.json_array_elements;
		if (member?.is_leader) {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, you are the Lobby Leader.` +
          `To start the Challenge, use \`\`${isEvent ? "ev" : "rd"} start\`\``
			);
			return;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_SUCCESS_TITLE);
		if (member?.is_ready) {
			embed.setDescription(
				`You are ready to take on this ${
					isEvent ? "Event" : "Raid"
				} Challenge. We've DMed the Lobby Leader to start the ${
					isEvent ? "Event" : "Raid"
				} Challenge.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		currentRaid.lobby[user.id].is_ready = true;
		updateRaid({ id: currentRaid.id }, { lobby: currentRaid.lobby });
		const membersReady = lobbyMembers.filter((l) => lobby[l].is_ready);
		const leader = lobby[leaderId];
		DMUser(
			client,
			`${membersReady.length || 1} Member(s) are ready to take on the ${
				isEvent ? "Event" : "Raid"
			} Challenge. To start the ${
				isEvent ? "Event" : "Raid"
			} Challenge use \`\`${isEvent ? "ev" : "rd"} start\`\``,
			leader.user_tag
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.memberReady(): something went wrong",
			err
		);
		return;
	}
};
