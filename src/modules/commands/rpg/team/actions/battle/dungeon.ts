import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { TeamExtraProps } from "@customTypes/teams";
import { getUserLevel } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { addTeamEffectiveness } from "helpers/adventure";
import { HIDE_VISUAL_BATTLE_ARG } from "helpers/constants";
import {
	prepareSkewedCollectionsForBattle,
	validateAndPrepareTeam,
} from "helpers/teams";
import loggers from "loggers";
import { simulateBattle } from "modules/commands/rpg/adventure/battle/battle";
import { prepareDungeonBoss } from "modules/commands/rpg/dungeon";
import { reducedComputedLevels } from "modules/commands/rpg/dungeon/computeLevel";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import * as battlePerChannel from "../../../adventure/battle/battlesPerChannelState";

const spawnDGBoss = async (level: number, id: string) => {
	let rank_id = 1;
	if (level >= 70) {
		rank_id = 5;
	} else if (level >= 40) {
		rank_id = 4;
	} else if (level >= 20) {
		rank_id = 3;
	} else if (level >= 10) {
		rank_id = 2;
	}
	const allDGRanks = reducedComputedLevels();
	const dungeonBoss = await prepareDungeonBoss({
		division: 3,
		r_exp: 0,
		rank: allDGRanks[rank_id].name,
		rank_id,
		user_tag: id,
		wins: 0,
		loss: 0,
		id: 0,
		exp: 0,
	});
	const enemyStats = await prepareSkewedCollectionsForBattle({
		collections: dungeonBoss,
		id: "Team Dungeon Boss",
		name: "Necromancer's Guardians",
	});

	return enemyStats;
};

export const teamDGBattle = async ({
	context,
	client,
	args,
	author,
	selectedTeamId,
	user_id
}: Omit<BaseProps, "options"> & {
	author: AuthorProps;
	user_id: number;
  } & TeamExtraProps) => {
	try {
		if (!context.channel?.id) return;
		const battlesInChannel = battlePerChannel.validateBattlesInChannel(
			context.channel.id
		);
		if (battlesInChannel === undefined) return;
		const cmd = "in-team-dg";
		let inBattle = await getCooldown(author.id, cmd);
		if (inBattle) {
			context.channel.sendMessage(
				`Summoner **${author.username}**, Your battle is in progress.`
			);
			return;
		}
		if (!selectedTeamId) {
			context.channel.sendMessage(
				`Summoner **${author.username}**, ` +
          "Please select a valid team to start a dungeon battle."
			);
			return;
		}
		const userLevel = await getUserLevel(user_id);
		const [ playerTeam, enemyStats ] = await Promise.all([
			validateAndPrepareTeam(
				user_id,
				author.id,
				selectedTeamId,
				context.channel,
				true
			),
			spawnDGBoss(userLevel?.level || 30, author.id), // Default base user level
		]);
		if (!playerTeam) {
			context.channel.sendMessage(
				"We could not start your battle, please try again"
			);
			return;
		}
		const playerTeamStats = playerTeam?.stats;
		const {
			playerStats: effectiveStats,
			opponentStats: opponentEffectiveStats,
		} = addTeamEffectiveness({
			cards: playerTeamStats.cards,
			enemyCards: enemyStats.cards,
			playerStats: playerTeamStats.totalStats,
			opponentStats: enemyStats.totalStats,
		});

		enemyStats.totalStats = opponentEffectiveStats;
		playerTeamStats.totalStats = effectiveStats;
		enemyStats.isBot = true;
		inBattle = await getCooldown(author.id, cmd);
		if (inBattle) return;
		setCooldown(author.id, cmd, 60 * 5);
		const hideBt = (args.shift() || "").toLowerCase();
		const result = await simulateBattle({
			context,
			playerStats: playerTeamStats,
			enemyStats,
			title: "__Team Dungeon Battle__",
			isRaid: false,
			options: { hideVisualBattle: hideBt === HIDE_VISUAL_BATTLE_ARG ? true : false, },
		});
		if (!result) {
			context.channel?.sendMessage(
				"Unable to process battle, please try again later"
			);
			return;
		}
		clearCooldown(author.id, cmd);
		if (result?.isForfeit) {
			result.isVictory = false;
		}

		const embed = createEmbed(author, client)
			.setTitle(
				result.isVictory
					? `Victory ${emoji.celebration}`
					: `Defeated ${emoji.cry}`
			)
			.setDescription(
				`**Total Damage Dealt**\n\nSummoner **${
					author.username
				}, You have dealt:**\n\n**__${
					numericWithComma(result.totalDamage || 0)
				}__** Damage to ${enemyStats.name}`
			);

		context.channel.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("team.actions.battle.teamDGBattle: ERROR", err);
		return;
	}
};
