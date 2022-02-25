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
		if (lobby[user.id].is_leader) {
			const lobbyMembers: (keyof RaidLobbyProps)[] = Object.keys(lobby).map((k) => Number(k));
			if (lobbyMembers.length > 1) {
				lobby[lobbyMembers[1]].is_leader = true;
			}
		}
		delete lobby[user.id];
		await updateRaid({ id: currentRaid.id }, { lobby: lobby });
		context.channel?.sendMessage(`You have left the ${isEvent ? "Event" : "Raid"} Challenge`);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.leaveLobby(): something went wrong", err);
		return;
	}
};