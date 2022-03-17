import { RaidActionProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { validateCurrentRaid } from "./validateRaid";

export const kickmember = async ({
	context, options, client, isEvent, args 
}: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(user.id, author, client, context.channel);
		if (!currentRaid) return;
		const kickId = Number(args.shift());
		if (isNaN(kickId)) return;
		if (user.id === kickId) {
			context.channel?.sendMessage("You cannot kick yourself");
			return;
		}
		const lobby = currentRaid.lobby;
		if (!lobby[user.id].is_leader) {
			context.channel?.sendMessage("You are not allowed to use this command");
			return;
		}
		if (currentRaid.is_start) {
			context.channel?.sendMessage("The raid has already started! Use ``votekick <votekick ID>`` " +
			"to kick this member from the lobby");
			return;
		}
		const kickedUsername = lobby[kickId].username;
		const kickedUserTag = lobby[kickId].user_tag;
		delete lobby[kickId];
		await updateRaid({ id: currentRaid.id }, { lobby: lobby });
		const desc = `been kicked from the ${
			isEvent ? "Event" : "Raid"
		} Challenge`;
		context.channel?.sendMessage(`**${kickedUsername}** has ${desc}`);
		DMUser(client, `You have ${desc}`, kickedUserTag);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.kickmember(): something went wrong", err);
		return;
	}
};