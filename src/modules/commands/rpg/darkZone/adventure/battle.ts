import { DzFuncProps } from "@customTypes/darkZone";
import { getDzTeam } from "api/controllers/DarkZoneTeamsController";
import { getRPGUser } from "api/controllers/UsersController";
import { startTransaction } from "api/models/Users";
import { createEmbed } from "commons/embeds";
import { addTeamEffectiveness } from "helpers/adventure";
import { validateFiveMinuteTimer } from "helpers/battle";
import { DEFAULT_ERROR_TITLE, HIDE_VISUAL_BATTLE_ARG, MANA_PER_BATTLE } from "helpers/constants/constants";
import { prepareTeamForBattle } from "helpers/teams";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { simulateBattle } from "../../adventure/battle/battle";
import * as battlePerChannel from "../../adventure/battle/battlesPerChannelState";
import { spawnDGBoss } from "../../dungeon/v2/battle";
import { processBattleRewards } from "./battleReward";

export const battleDzFloor = async ({
	context, client, options, dzUser, args 
}: DzFuncProps) => {
	try {
		const { author } = options;
		const battlesInChannel = battlePerChannel.validateBattlesInChannel(
			context.channel?.id || ""
		);
		if (battlesInChannel === undefined) return;

		const cdKey = "mana-battle";

		let inBattle = await getCooldown(author.id, cdKey);
		if (inBattle) {
			await validateFiveMinuteTimer({
				timestamp: inBattle.timestamp,
				key: `cooldown::mana-battle-${author.id}`,
			});
			context.channel?.sendMessage(
				"Your battle is still in progress. " +
          "(If you have completed your battle and are still seeing this, please try again in 1 minute)"
			);
			return;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!dzUser.selected_team_id) {
			embed.setDescription("Please select a valid team to participate in floor battles.");
			context.channel?.sendMessage(embed);
			return;
		}
		const dzTeam = await getDzTeam(author.id);
		if (!dzTeam) {
			context.channel?.sendMessage("We could not find your Dark Zone Team. " +
            "Please create one using `iz dz tm set <#ID> <position>`");
			return;
		}
		const teamCards = dzTeam.team.filter((t) => t.collection_id !== null);
		if (teamCards.length <= 0) {
			embed.setDescription("There are no cards in your team. " +
            "Please select a valid team to participate in floor battles.\n\n" +
            "Use `iz dz tm set <#ID> <position>` to assign a card to your team.");
			context.channel?.sendMessage(embed);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.mana < MANA_PER_BATTLE) {
			embed.setDescription("You do not have enough mana to proceed! " +
            `**[${user.mana} / ${MANA_PER_BATTLE}]** Mana`);

			context.channel?.sendMessage(embed);
			return;
		}
		const paramArgs = (args.shift() || "").toLowerCase();
		if (args && paramArgs === "all") {
			const inCd = await getCooldown(author.id, cdKey);
			if (inCd) return;
			if (dzUser.floor >= dzUser.max_floor) {
				embed.setDescription("You must battle this floor atleast once!");
				context.channel?.sendMessage(embed);
				return;
			}
			await setCooldown(author.id, cdKey, 1);
			const multiplier = Math.floor(user.mana / MANA_PER_BATTLE) || 1;
			processBattleRewards({
				isVictory: true,
				author,
				multiplier,
				dzUser,
				battlingFloor: dzUser.floor,
				channel: context.channel,
				client,
				maxMana: user.max_mana
			});
			await clearCooldown(author.id, cdKey);
			return;
		}
		const playerStats = await prepareTeamForBattle({
			team: {
				user_id: user.id,
				name: author.username,
				metadata: dzTeam.team,
				id: dzTeam.id
			},
			isDarkZone: true,
			user_id: user.id,
			id: author.id,
			canAddGuildStats: true,
			capCharacterMaxLevel: false,
            
		});
		if (!playerStats) {
			context.channel?.sendMessage("You do not have a valid Dark Zone team, Please reset your team " +
            "using `iz dz tm reset`");
			return;
		}
		const floorDifficulty = getFloorDifficulty(dzUser.floor);
		loggers.info("spawning dark zone floor boss: ", floorDifficulty);
		const opponent = await spawnDGBoss({
		    user_tag: author.id,
		    rank_id: floorDifficulty.difficulty,
			division: floorDifficulty.division,
			rank: floorDifficulty.name,
			id: 0,
			wins: 0,
			loss: 0,
			r_exp: 0,
			exp: 0,
			match_making_rate: 0
		}, "Dark Zone Boss", floorDifficulty.division);

		const _effectiveness = addTeamEffectiveness({
			cards: playerStats.cards,
			enemyCards: opponent.cards,
			playerStats: playerStats.totalStats,
			opponentStats: opponent.totalStats,
		});
		playerStats.totalStats = _effectiveness.playerStats;
		opponent.totalStats = _effectiveness.opponentStats;
		inBattle = await getCooldown(author.id, cdKey);
		if (inBattle) return;
		setCooldown(author.id, cdKey, 60 * 5);
		const result = await simulateBattle({
			context,
			playerStats,
			enemyStats: opponent,
			title: `__Dark Zone Challenging Floor ${dzUser.floor}__`,
			isRaid: false,
			options: { hideVisualBattle: paramArgs === HIDE_VISUAL_BATTLE_ARG ? true : false, },
		});
		clearCooldown(author.id, cdKey);
		if (!result) {
			context.channel?.sendMessage(
				"Unable to process battle, please try again later"
			);
			return;
		}
		if (result.isForfeit) {
			context.channel?.sendMessage(`Summoner **${author.username}**, You have forfeit your battle! ` +
            "You will not receive any rewards.");
			consumeMana(author.id);
			return;
		}
		processBattleRewards({
			isVictory: result.isVictory || false,
			author,
			multiplier: 1,
			dzUser,
			battlingFloor: dzUser.floor,
			channel: context.channel,
			client,
			maxMana: user.max_mana
		});
		return;
	} catch (err) {
		loggers.error("adventure.battle.battleDzFloor: ERROR", err);
		return;
	}
};

const consumeMana = async (userTag: string, manaToConsume = MANA_PER_BATTLE) => {
	await startTransaction(async (trx) => {
		try {
			await trx("users").where({ user_tag: userTag })
				.update({ mana: trx.raw("mana - ??", manaToConsume) });
		} catch (err) {
			loggers.error("Unable to consume mana:", err);
		}
	});
};

const difficultyMap: {[key: number]: { division: number; difficulty: number; name: string; }} = {
	20: {
		division: 1,
		difficulty: 1,
		name: "duke"
	},
	30: {
		division: 2, // 2 bosses
		difficulty: 1,
		name: "duke"
	},
	50: {
		division: 3,
		difficulty: 2,
		name: "ranger"
	},
	80: {
		division: 3,
		difficulty: 3,
		name: "zeke"
	},
	120: {
		division: 3,
		difficulty: 4,
		name: "hero"
	},
	160: {
		division: 2,
		difficulty: 5,
		name: "grand master"
	}
};

const getFloorDifficulty = (floor: number) => {
	const dataToLoop = Object.keys(difficultyMap);
	let difficulty = difficultyMap["160"];
	for (const fl of dataToLoop) {
		if (floor <= +fl) {
			difficulty = difficultyMap[+fl];
			break;
		}
	}
	if (floor > 160) {
		difficulty = difficultyMap["160"];
	}
	return difficulty;
};
