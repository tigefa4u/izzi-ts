import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getTeamById } from "api/controllers/TeamsController";
import { getRPGUser, getUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import { getIdFromMentionedString } from "helpers";
import {
	prepareTeamForBattle,
	validateAndPrepareTeam,
	validateTeam,
} from "helpers/teams";
import loggers from "loggers";
import { simulateBattle } from "../../../adventure/battle/battle";
import * as battlePerChannel from "../../../adventure/battle/battlesPerChannelState";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { addTeamEffectiveness } from "helpers/adventure";

export const teamBattle = async ({
	client,
	context,
	args,
	author,
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	try {
		if (!context.channel?.id) return;
		const battlesInChannel = battlePerChannel.validateBattlesInChannel(
			context.channel.id
		);
		if (battlesInChannel === undefined) return;
		const mentionId = getIdFromMentionedString(args.shift() || "");
		if (!mentionId) return;
		const [ _inBattle, _mentionIdInBattle ] = await Promise.all([
			getCooldown(author.id, "in-battle"),
			getCooldown(mentionId, "in-battle"),
		]);
		if (_inBattle || _mentionIdInBattle) {
			context.channel.sendMessage("One of the summoners' is currently in a team battle");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
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

		const [ playerStats, opponentStats ] = await Promise.all([
			validateAndPrepareTeam(
				user.id,
				user.user_tag,
				user.selected_team_id,
				context.channel
			),
			validateAndPrepareTeam(
				mentionedUser.id,
				mentionedUser.user_tag,
				mentionedUser.selected_team_id,
				context.channel
			),
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
		const { playerStats: effectiveStats, opponentStats: opponentEffectiveStats } = await addTeamEffectiveness({
			cards: playerStats.stats.cards,
			enemyCards: opponentStats.stats.cards,
			playerStats: playerStats.stats.totalStats,
			opponentStats: opponentStats.stats.totalStats 
		});
		playerStats.stats.totalStats = effectiveStats;
		opponentStats.stats.totalStats = opponentEffectiveStats;
		Promise.all([ setCooldown(author.id, "in-battle", 60 * 5), setCooldown(mentionId, "in-battle", 60 * 5) ]);
		const battleStatus = await simulateBattle({
			context,
			playerStats: playerStats.stats,
			enemyStats: opponentStats.stats,
			title: `__Team Battle Challenge ${author.username} vs ${mentionedUser.username}__`,
		});
		Promise.all([ clearCooldown(author.id, "in-battle"), clearCooldown(mentionId, "in-battle") ]);
		if (battleStatus?.isForfeit) return;
		sendResultMessage({
			channel: context.channel,
			username: author.username,
			mentionUsername: mentionedUser.username,
			isVictory: battleStatus?.isVictory || false,
			opponentTeamName: opponentStats.name,
			playerTeamName: playerStats.name,
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
