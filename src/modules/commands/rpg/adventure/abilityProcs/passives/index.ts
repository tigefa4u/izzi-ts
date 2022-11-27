import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
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
	simulation,
	basePlayerStats
}: BattleProcessProps) => {
	if (!card) return;
	// Rework - wrecker should buff all team atk
	// 'At the start of the match increase your __ATK__ by __50%__. Your attack decreases by 6% each turn.'
	if (round === 1 && !playerStats.totalStats.isWrecker) {
		playerStats.totalStats.isWrecker = true;
		card.isUseWreckerPassive = true;
		// 	playerStats.totalStats.vitality =
		//   playerStats.totalStats.vitality - card.stats.vitality;
		const percent = calcPercentRatio(60, card.rank);
		const percentDec = calcPercentRatio(6, card.rank);
		const ratio = getRelationalDiff(basePlayerStats.totalStats.vitality, percent);
		// const atkInc = card.stats.vitality + ratio;
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
		const desc = `increasing all ally **ATK** by __${percent}%__. ` +
		`All ally **ATK** will decrease by __${percentDec}%__ each round.`;
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
			const inc = calcPercentRatio(5, card.rank);
			const decRatio = getRelationalDiff(basePlayerStats.totalStats.vitality, inc);
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
	// When your **health %** is lower than that of the enemy increase your **ATK/DEF/CRIT CHANCE** by __20%__
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
		const percent = calcPercentRatio(20, card.rank);

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
	// cap at 150%
	// boost atk & def, more like bulkup
	// while your hp is low increase the **ATK** and **DEF** of all allies by __15%__
	const hpRatio = Math.floor(playerStats.totalStats.originalHp * (30 / 100));
	if (
		playerStats.totalStats.strength <= hpRatio &&
    !playerStats.totalStats.isSpirit
	) {
		playerStats.totalStats.isSpirit = true;
		const percent = calcPercentRatio(15, card.rank);
		if (!basePlayerStats.totalStats.fs) basePlayerStats.totalStats.fs = 1;
		const incPercent = basePlayerStats.totalStats.fs * percent;
		const ratio = getRelationalDiff(
			basePlayerStats.totalStats.vitality,
			incPercent
		);
		const defIncRation = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			incPercent
		);
		basePlayerStats.totalStats.fs++;
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
		playerStats.totalStats.defense = playerStats.totalStats.defense + defIncRation;
		const desc = `increasing **ATK** and **DEF** of all allies by __${percent}%__`;
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
	// while the enemy is asleep deal 120% bonus damage based on difference in ATK
	// and heal for 80% based on damage dealt.
	let abilityDamage, damageDiff;
	if (opponentStats.totalStats.isAsleep) {
		const atkDifference = Math.abs(opponentStats.totalStats.vitality - playerStats.totalStats.vitality);
		const percent = calcPercentRatio(120, card.rank);
		abilityDamage = getRelationalDiff(atkDifference, percent);
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

		const healPercent = calcPercentRatio(80, card.rank);
		const heal = getRelationalDiff(abilityDamage, healPercent);
		playerStats.totalStats.strength = playerStats.totalStats.strength + heal;
		if (playerStats.totalStats.strength > playerStats.totalStats.originalHp) {
			playerStats.totalStats.strength = playerStats.totalStats.originalHp;
			if (playerStats.totalStats.isBleeding) playerStats.totalStats.isBleeding = false;
		}
		const healDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);

		const processedHealHpBar = processHpBar(playerStats.totalStats, healDiff);
		playerStats.totalStats.health = processedHealHpBar.health;
		playerStats.totalStats.strength = processedHealHpBar.strength;

		const desc = `Inflitcing a stack of **Nightmare** ${emoji.nightmare} on __${opponentStats.name}__ ` +
		`dealing __${abilityDamage}__ damage and restores __${heal}__ **HP**`;
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
