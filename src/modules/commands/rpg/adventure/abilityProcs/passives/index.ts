import { BattleProcessProps } from "@customTypes/adventure";
import { randomElementFromArray } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	getPlayerDamageDealt,
	getRelationalDiff,
	processHpBar,
	relativeDiff,
} from "helpers/battle";

export * from "./heals";
export * from "./elementals";

export const wrecker = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation
}: BattleProcessProps) => {
	if (!card) return;
	// 'At the start of the match increase your __ATK__ by __90%__. Your attack decreases by 12% each turn.'
	if (round === 1 && !playerStats.totalStats.isWrecker) {
		playerStats.totalStats.isWrecker = true;
		card.isUseWreckerPassive = true;
		playerStats.totalStats.vitality =
      playerStats.totalStats.vitality - card.stats.vitality;
		const percent = calcPercentRatio(90, card.rank);
		const ratio = getRelationalDiff(card.stats.vitality, percent);
		const atkInc = card.stats.vitality + ratio;
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + atkInc;
		const desc = `increasing **ATK** by __${percent}%__`;
		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: false,
			simulation
		});
	} else {
		if (playerStats.totalStats.isWrecker && card.isUseWreckerPassive) {
			const inc = calcPercentRatio(12, card.rank);
			const decRatio = getRelationalDiff(card.stats.vitality, inc);
			playerStats.totalStats.vitality =
        playerStats.totalStats.vitality - decRatio;
			if (playerStats.totalStats.vitality <= 0)
				playerStats.totalStats.vitality = 1;
		}
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const berserk = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation
}: any) => {
	if (!card) return;
	// When your **health %** is lower than that of the enemy increase your **ATK/DEF/CRIT CHANCE** by __18%__
	const playerHpRatio = playerStats.totalStats.strength / 100;
	const enemyHpRatio = opponentStats.totalStats.strength / 100;
	playerStats.totalStats.previousRound ? playerStats.totalStats.previousRound ++ : null;
	if (playerHpRatio <= enemyHpRatio && !playerStats.totalStats.isBerserk) {
		playerStats.totalStats.isBerserk = true;
		playerStats.totalStats.previousRound = round;
		const temp = randomElementFromArray([ "vitality", "defense", "critical" ]);
		if (!basePlayerStats.totalStats[`${temp}Temp`])
			basePlayerStats.totalStats[`${temp}Temp`] = 1;
		if (temp !== "critical") {
			playerStats.totalStats[temp] =
        playerStats.totalStats[temp] -
        (card.stats[`${temp}Inc`] || card.stats[temp]);
		}
		const percent = calcPercentRatio(18, card.rank);

		const ratio =
      card.stats[temp] *
      ((basePlayerStats.totalStats[`${temp}Temp`] * percent) / 100);
		basePlayerStats.totalStats[`${temp}Temp`] =
      basePlayerStats.totalStats[`${temp}Temp`] + 1;
		// Object.assign(basePlayerStats, {
		//   [`${temp}Temp`]: basePlayerStats[`${temp}Temp`],
		// });
		const inc = card.stats[temp] + ratio;
		if (temp !== "critical") {
			card.stats[`${temp}Inc`] = inc;
		}
		playerStats.totalStats[temp] = playerStats.totalStats[temp] + inc;
		const desc = `increasing it's **${
			temp === "vitality" ? "ATK" : temp === "defense" ? "DEF" : "CRIT Chance"
		}** by __${percent}%__`;
		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: false,
			simulation
		});
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const fightingSpirit = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation
}: BattleProcessProps) => {
	if (!card || !playerStats.totalStats.originalHp) return;
	// while your hp is low increase the **ATK** of all allies by __8%__
	const hpRatio = Math.floor(playerStats.totalStats.originalHp * (30 / 100));
	if (
		playerStats.totalStats.strength <= hpRatio &&
    !playerStats.totalStats.isSpirit
	) {
		playerStats.totalStats.isSpirit = true;
		const percent = calcPercentRatio(8, card.rank);
		if (!basePlayerStats.totalStats.fs) basePlayerStats.totalStats.fs = 1;
		const ratio = getRelationalDiff(
			basePlayerStats.totalStats.vitality,
			basePlayerStats.totalStats.fs * percent
		);
		basePlayerStats.totalStats.fs++;
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
		const desc = `increasing **ATK** of all allies by __${percent}%__`;
		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: false,
			simulation
		});
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const dreamEater = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation
}: BattleProcessProps) => {
	if (
		!card ||
    !playerStats.totalStats.originalHp ||
    !opponentStats.totalStats.originalHp
	)
		return;
	// while the enemy is asleep deal 30% bonus damage and heal for 7% based on your base damage.
	let abilityDamage, damageDiff;
	if (opponentStats.totalStats.isAsleep) {
		const baseDamage = getPlayerDamageDealt(
			playerStats.totalStats,
			opponentStats.totalStats
		);
		const percent = calcPercentRatio(30, card.rank);
		abilityDamage = getRelationalDiff(baseDamage, percent);
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - abilityDamage;
		if (opponentStats.totalStats.strength <= 0)
			opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (damageDiff <= 0) damageDiff = 0;
		
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;

		const healPercent = calcPercentRatio(7, card.rank);
		const heal = getRelationalDiff(baseDamage, healPercent);
		playerStats.totalStats.strength = playerStats.totalStats.strength + heal;
		if (playerStats.totalStats.strength > playerStats.totalStats.originalHp)
			playerStats.totalStats.strength = playerStats.totalStats.originalHp;
		const healDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);

		const processedHealHpBar = processHpBar(playerStats.totalStats, healDiff);
		playerStats.totalStats.health = processedHealHpBar.health;
		playerStats.totalStats.strength = processedHealHpBar.strength;

		const desc = `Deals __${abilityDamage}__ damage and restores __${heal}__ **HP**`;
		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: false,
			simulation
		});
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage,
	};
};
