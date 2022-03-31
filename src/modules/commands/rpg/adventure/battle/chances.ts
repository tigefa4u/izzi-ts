import { PrepareBattleDescriptionProps } from "@customTypes/adventure";
import { probability } from "helpers";

export const prepareCriticalHitChance = ({ isPlayerFirst, playerStats, enemyStats }: PrepareBattleDescriptionProps & {
    isPlayerFirst: boolean;
}) => {
	let criticalHitPercent = isPlayerFirst
		? playerStats.totalStats.critical
		: enemyStats.totalStats.critical;

	let noCriticalHitPercent = 1;
	if (criticalHitPercent <= 1) {
		criticalHitPercent = 0;
		noCriticalHitPercent = 0;
	}
	const critChance = [ true, false ];
	const chance = [ criticalHitPercent, noCriticalHitPercent ];
	const chanceProced = critChance[probability(chance)];
	if (chanceProced)
		isPlayerFirst
			? (playerStats.totalStats.isCriticalHit = true)
			: (enemyStats.totalStats.isCriticalHit = true);
	else {
		if (playerStats.totalStats.isCriticalHit) playerStats.totalStats.isCriticalHit = false;
		if (enemyStats.totalStats.isCriticalHit) enemyStats.totalStats.isCriticalHit = false;
	}

	return {
		playerStats,
		enemyStats 
	};
};

export const prepareEvadeHitChance = ({ isPlayerFirst, playerStats, enemyStats }: PrepareBattleDescriptionProps & {
    isPlayerFirst: boolean;
}) => {
	let evadeHitPercent = isPlayerFirst
		? enemyStats.totalStats.evasion
		: playerStats.totalStats.evasion;

	let noEvadeHitPercent = 1;
	if (evadeHitPercent <= 1) {
		evadeHitPercent = 0;
		noEvadeHitPercent = 0;
	}
	const evadeChance = [ true, false ];
	const chance = [ evadeHitPercent, noEvadeHitPercent ];
	const isHit = evadeChance[probability(chance)];
	if (isHit)
		isPlayerFirst
			? (enemyStats.totalStats.isEvadeHit = true)
			: (playerStats.totalStats.isEvadeHit = true);
	else {
		if (playerStats.totalStats.isEvadeHit) playerStats.totalStats.isEvadeHit = false;
		if (enemyStats.totalStats.isEvadeHit) enemyStats.totalStats.isEvadeHit = false;
	}
	if (isPlayerFirst) {
		if (playerStats.totalStats.accuracy >= enemyStats.totalStats.evasion) {
			enemyStats.totalStats.isEvadeHit = false;
		}
	} else {
		if (enemyStats.totalStats.accuracy >= playerStats.totalStats.evasion) {
			playerStats.totalStats.isEvadeHit = false;
		}
	}
	return {
		playerStats,
		enemyStats 
	};
};