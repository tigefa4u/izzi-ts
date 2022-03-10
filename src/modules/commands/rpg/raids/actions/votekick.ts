import { RaidActionProps, RaidLobbyProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { validateCurrentRaid } from "./validateRaid";

export const voteKickMember = async ({
	context,
	options,
	client,
	isEvent,
	args,
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
		const kickId = Number(args.shift());
		if (isNaN(kickId)) return;
		if (kickId === user.id) {
			context.channel?.sendMessage("You cannot vote kick yourself!");
			return;
		}

		const lobby = currentRaid.lobby;
		const thirtyMins = 1000 * 60 * 30;
		if (!lobby[kickId]) {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, the member you are trying to votekick is not in your lobby!`
			);
			return;
		}
		if (
			new Date().valueOf() - new Date(lobby[kickId].timestamp).valueOf() >=
      thirtyMins
		) {
			if ((lobby[user.id].kickVotes || {})[kickId]) {
				context.channel?.sendMessage(
					`Summoner **${author.username}**, you have already voted to kick this member!`
				);
				return;
			}
			const kickVotes = lobby[user.id].kickVotes || {};
			kickVotes[kickId] = true;
			lobby[user.id].kickVotes = kickVotes;
			lobby[kickId].votes = (Number(lobby[kickId].votes) || 0) + 1;
			const lobbyMembers = Object.keys(lobby).map((i) => Number(i));
			const requiredVotes = Math.ceil(lobbyMembers.length * (50 / 100));
			if ((lobby[kickId].votes || 0) >= requiredVotes) {
				if (lobby[kickId].is_leader) {
					if (lobbyMembers.length > 1) {
						lobby[lobbyMembers[1]].is_leader = true;
					}
				}
				const desc = `been kicked from the ${
					isEvent ? "Event" : "Raid"
				} Challenge`;
				context.channel?.sendMessage(`${lobby[kickId].username} has ${desc}`);
				DMUser(client, `You have ${desc}`, lobby[kickId].user_tag);
				delete lobby[kickId];
			} else {
				context.channel?.sendMessage(
					`You have voted to kick ${lobby[kickId].username} from the ${
						isEvent ? "Event" : "Raid"
					} Challenge!`
				);
			}
			await updateRaid({ id: currentRaid.id }, { lobby: lobby });
		} else {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, You cannot kick a member who is not afk for more than 30 minutes!`
			);
			return;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.voteKickMember(): something went wrong",
			err
		);
		return;
	}
};
