import { BattleProcessProps, BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import emoji from "emojis/emoji";
import { randomElementFromArray } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { addTeamEffectiveness } from "helpers/adventure";
import {
	getPlayerDamageDealt,
	getRelationalDiff,
	processEnergyBar,
	processHpBar,
	relativeDiff,
} from "helpers/battle";

export * from "./heals";
export * from "./elementals";
export * from "./defensiveOffense";

export const wrecker = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation,
	basePlayerStats,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card) return;
	// Rework - wrecker should buff all team atk
	// 'At the start of the match increase your __ATK__ by __90%__. Your attack decreases by 8% each turn.'
	if (round === 1 && !playerStats.totalStats.isWrecker) {
		playerStats.totalStats.isWrecker = true;
		card.isUseWreckerPassive = true;
		// 	playerStats.totalStats.vitality =
		//   playerStats.totalStats.vitality - card.stats.vitality;
		const percent = calcPercentRatio(90, card.rank);
		const intPercent = calcPercentRatio(28, card.rank);
		const percentDec = calcPercentRatio(8, card.rank);
		const ratio = getRelationalDiff(
			basePlayerStats.totalStats.vitality,
			percent
		);
		// const atkInc = card.stats.vitality + ratio;
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;

		const intRatio = getRelationalDiff(
			basePlayerStats.totalStats.intelligence,
			intPercent
		);
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence + intRatio;

		const desc =
      `increasing all ally **ATK** by __${percent}%__ and **ARMOR** by __${intPercent}%__. ` +
      `All ally **ATK** and **ARMOR** will decrease by __${percentDec}%__ each round.`;
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
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	} else {
		if (playerStats.totalStats.isWrecker && card.isUseWreckerPassive) {
			const inc = calcPercentRatio(8, card.rank);
			const decRatio = getRelationalDiff(
				basePlayerStats.totalStats.vitality,
				inc
			);
			playerStats.totalStats.vitality =
        playerStats.totalStats.vitality - decRatio;
			if (playerStats.totalStats.vitality <= 0)
				playerStats.totalStats.vitality = 1;

			if (playerStats.totalStats.intelligence > 0) {
				const intDecRatio = getRelationalDiff(
					basePlayerStats.totalStats.intelligence,
					inc
				);
				playerStats.totalStats.intelligence - intDecRatio;
				if (playerStats.totalStats.intelligence < 0)
					playerStats.totalStats.intelligence = 0;

				const diff = getRelationalDiff(
					playerStats.totalStats.intelligence,
					basePlayerStats.totalStats.intelligence
				);
				const energy = processEnergyBar({
					dpr: diff,
					energy: playerStats.totalStats.energy
				});
				playerStats.totalStats.dpr = energy.dpr;
				playerStats.totalStats.energy = energy.energy;
			}
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
	simulation,
	baseEnemyStats,
}: any) => {
	if (!card) return;
	// When your **health %** is lower than that of the enemy increase your **ATK/DEF/CRIT CHANCE** by __20%__
	const playerHpRatio = playerStats.totalStats.strength / 100;
	const enemyHpRatio = opponentStats.totalStats.strength / 100;
	playerStats.totalStats.previousRound
		? playerStats.totalStats.previousRound++
		: null;
	if (playerHpRatio <= enemyHpRatio && !playerStats.totalStats.isBerserk) {
		playerStats.totalStats.isBerserk = true;
		playerStats.totalStats.previousRound = round;
		const temp = randomElementFromArray([ "vitality", "defense", "critical" ]);

		const percent = calcPercentRatio(20, card.rank);

		const ratio = playerStats.totalStats[temp] * (percent / 100);
		playerStats.totalStats[temp] =
      playerStats.totalStats[temp] + Number(ratio.toFixed(2));
		const desc = `increasing it's **True ${
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
			simulation,
			baseEnemyStats,
			basePlayerStats,
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
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card || !playerStats.totalStats.originalHp) return;
	// cap at 150%
	// boost atk & def, more like bulkup
	// while your hp is low increase the **ATK** and **DEF** of all allies by __35%__
	const hpRatio = Math.floor(playerStats.totalStats.originalHp * (35 / 100));
	if (
		playerStats.totalStats.strength <= hpRatio &&
    !playerStats.totalStats.isSpirit &&
	!playerStats.totalStats.isTrueAtk
	) {
		playerStats.totalStats.isSpirit = true;
		playerStats.totalStats.isTrueAtk = true;
		const percent = calcPercentRatio(20, card.rank);
		const ratio = getRelationalDiff(
			playerStats.totalStats.vitality,
			percent
		);
		const defIncRation = getRelationalDiff(
			playerStats.totalStats.defense,
			percent
		);
		// cap inc at 200%
		const cap = getRelationalDiff(
			basePlayerStats.totalStats.vitality,
			200
		);
		let desc = `**True DEF** of all allies by __${percent}%__`;
		if (playerStats.totalStats.vitality < cap) {
			playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
			desc = `**True ATK** and ${desc}`;
		}
		playerStats.totalStats.defense =
      playerStats.totalStats.defense + defIncRation;
		desc = `increasing ${desc}`;
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
			simulation,
			baseEnemyStats,
			basePlayerStats,
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
	simulation,
	baseEnemyStats,
	basePlayerStats,
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
		const atkDifference = Math.abs(
			opponentStats.totalStats.vitality - playerStats.totalStats.vitality
		);
		const percent = calcPercentRatio(80, card.rank);
		abilityDamage = getRelationalDiff(atkDifference, percent);

		// const elementalEffectiveness = addTeamEffectiveness({
		// 	cards: [ { type: card.type } ] as (CollectionCardInfoProps | undefined)[],
		// 	enemyCards: opponentStats.cards,
		// 	playerStats: { effective: 1 } as BattleStats["totalStats"],
		// 	opponentStats: { effective: 1 } as BattleStats["totalStats"],
		// });
		// const effective = elementalEffectiveness.playerStats.effective;

		if (abilityDamage > 5000) abilityDamage = 5000;
		// abilityDamage = Math.floor(abilityDamage * effective);
		// if (abilityDamage > 5000) abilityDamage = 5000;

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

		const healPercent = calcPercentRatio(33, card.rank);
		const heal = getRelationalDiff(abilityDamage, healPercent);
		playerStats.totalStats.strength = playerStats.totalStats.strength + heal;
		if (playerStats.totalStats.strength > playerStats.totalStats.originalHp) {
			playerStats.totalStats.strength = playerStats.totalStats.originalHp;
			if (playerStats.totalStats.isBleeding)
				playerStats.totalStats.isBleeding = false;
		}
		const healDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);

		const processedHealHpBar = processHpBar(playerStats.totalStats, healDiff);
		playerStats.totalStats.health = processedHealHpBar.health;
		playerStats.totalStats.strength = processedHealHpBar.strength;

		const desc =
      `Inflitcing a stack of **Nightmare** ${emoji.nightmare} on __${opponentStats.name}__ ` +
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
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage,
	};
};
