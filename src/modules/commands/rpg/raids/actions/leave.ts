import { RaidActionProps, RaidLobbyProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { validateCurrentRaid } from "./validateRaid";

export const leaveLobby = async ({ context, options, client, isEvent }: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(user.id, author, client, context.channel);
		if (!currentRaid) return;
		const lobby = currentRaid.lobby;
		const member = lobby[user.id];
		delete lobby[user.id];
		if (member.is_leader) {
			const lobbyMembers: (keyof RaidLobbyProps)[] = Object.keys(lobby).map((k) => Number(k));
			if (lobbyMembers.length > 0) {
				lobby[lobbyMembers[0]].is_leader = true;
			}
		}
		const body = { lobby };
		if (Object.keys(lobby).length <= 0 && currentRaid.is_start === false) {
			currentRaid.is_private = false;
			Object.assign(body, { is_private: currentRaid.is_private });
		}
		await updateRaid({ id: currentRaid.id }, body);
		context.channel?.sendMessage(`You have left the ${isEvent ? "Event" : "Raid"} Challenge`);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.leaveLobby(): something went wrong", err);
		return;
	}
};