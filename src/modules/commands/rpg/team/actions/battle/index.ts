import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getTeamById } from "api/controllers/TeamsController";
import { getRPGUser, getUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import { getIdFromMentionedString } from "helpers";
import { prepareTeamForBattle, validateTeam } from "helpers/teams";
import loggers from "loggers";
import { simulateBattle } from "modules/commands/rpg/adventure/battle";

export const teamBattle = async ({
	client,
	context,
	args,
	author,
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	try {
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const mentionId = getIdFromMentionedString(args.shift() || "");
		if (!mentionId) return;
		const mentionedUser = await getUser({
			user_tag: mentionId,
			is_banned: false,
		});
		if (!mentionedUser) return;
		if (!user.selected_team_id || !mentionedUser.selected_team_id) {
			context.channel?.sendMessage(
				"Both players must have valid team selected!"
			);
			return;
		}
		const [ playerTeam, opponentTeam ] = await Promise.all([
			getTeamById({
				id: user.selected_team_id,
				user_id: user.id,
			}),
			getTeamById({
				id: mentionedUser.selected_team_id,
				user_id: mentionedUser.id,
			}),
		]);
		if (!playerTeam || !validateTeam(playerTeam)) {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, Please select a valid Team.`
			);
			return;
		}
		if (!opponentTeam || !validateTeam(opponentTeam)) {
			context.channel?.sendMessage(
				`Summoner **${mentionedUser.username}**, Please select a valid Team.`
			);
			return;
		}

		const [ playerStats, opponentStats ] = await Promise.all([
			prepareTeamForBattle({
				team: playerTeam,
				user_id: user.id,
				id: user.user_tag,
			}),
			prepareTeamForBattle({
				team: opponentTeam,
				user_id: mentionedUser.id,
				id: mentionedUser.user_tag,
			}),
		]);
		if (!playerStats) {
			context.channel?.sendMessage(
				`Summoner **${author.username}** is unable to prepare for battle. Please reset your team`
			);
			return;
		}
		if (!opponentStats) {
			context.channel?.sendMessage(
				`Summoner **${mentionedUser.username}** is unable to prepare for battle. Please reset your team`
			);
			return;
		}
		const battleStatus = await simulateBattle({
			context,
			playerStats,
			enemyStats: opponentStats,
			title: `__Team Battle Challenge ${author.username} vs ${mentionedUser.username}__`,
		});
		sendResultMessage({
			channel: context.channel,
			username: author.username,
			mentionUsername: mentionedUser.username,
			isVictory: battleStatus?.isVictory || false,
			opponentTeamName: opponentTeam.name,
			playerTeamName: playerTeam.name,
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.teamBattle(): something went wrong",
			err
		);
		return;
	}
};

function sendResultMessage({
	channel,
	username,
	mentionUsername,
	isVictory,
	playerTeamName,
	opponentTeamName,
}: {
  channel: ChannelProp;
  username: string;
  mentionUsername: string;
  isVictory: boolean;
  playerTeamName: string;
  opponentTeamName: string;
}) {
	channel?.sendMessage(
		`Congratulations ${emoji.welldone} **${
			isVictory ? username : mentionUsername
		}!** You have defeated ${isVictory ? mentionUsername : username}'s __Team ${
			isVictory ? opponentTeamName : playerTeamName
		}__ in battle!`
	);

	return;
}
