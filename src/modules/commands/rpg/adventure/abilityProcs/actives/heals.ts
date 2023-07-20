import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { randomElementFromArray } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";

export const lifesteal = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation,
	basePlayerStats,
	baseEnemyStats
}: BattleProcessProps) => {
	if (!card) return;
	// Increase life steal by __25%__ and buff ATK by 10%.
	if (round % 3 === 0 && !playerStats.totalStats.isLifestealProc) {
		playerStats.totalStats.isLifesteal = true;
		playerStats.totalStats.isLifestealProc = true;
		const percent = calcPercentRatio(25, card.rank);
		const atkPercent = calcPercentRatio(10, card.rank);
		const ratio = getRelationalDiff(basePlayerStats.totalStats.vitality, atkPercent);
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
		playerStats.totalStats.lifestealPercent = playerStats.totalStats.lifestealPercent
			? playerStats.totalStats.lifestealPercent + percent
			: percent;
		const desc = `Increasing **lifesteal** of all allies by __${percent}%__ ` +
		`as well as increasing all ally **ATK** by __${atkPercent}__%`;
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
			basePlayerStats
		});
	}
	return {
		playerStats,
		opponentStats 
	};
};

export const revitalize = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
	baseEnemyStats
}: BattleProcessProps) => {
	if (!card || !playerStats.totalStats.originalHp) return;
	// Restore 18% of missing health of all allies
	// as well as increase their speed by __8%__
	// atk buff is too much
	if (round % 3 === 0 && !playerStats.totalStats.isRevit) {
		playerStats.totalStats.isRevit = true;
		const missingHp = playerStats.totalStats.originalHp - playerStats.totalStats.strength;
		const percent = calcPercentRatio(18, card.rank);
		const restoreDiff = getRelationalDiff(missingHp, percent);
		let restorePoints = playerStats.totalStats.strength + restoreDiff;
		if (restorePoints >= playerStats.totalStats.originalHp)
			restorePoints = playerStats.totalStats.originalHp;
		playerStats.totalStats.strength = restorePoints;
		// Use the same for all abilities that buff stats
		// buff stats from base stats
		const incPercent = calcPercentRatio(10, card.rank);
		const ratio = getRelationalDiff(basePlayerStats.totalStats.vitality, incPercent);
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
		const damageDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);

		const processedHpBar = processHpBar(playerStats.totalStats, damageDiff);
		playerStats.totalStats.health = processedHpBar.health;
		playerStats.totalStats.strength = processedHpBar.strength;

		const desc = `Buffing all allies' **HP**, restores __${restoreDiff}__ ${emoji.heal} health, ` +
        `as well as increasing **ATK** by __${incPercent}%__`;
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
			basePlayerStats
		});
	}
	return {
		playerStats,
		opponentStats 
	};
};

export const guardian = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats
}: any) => {
	let damageDiff;
	if (!card || !playerStats.totalStats.originalHp) return;
	// restore (15% - 17%) health based on your DEF and also increase the __DEF__ of all allies for the same %
	if (round % 2 === 0 && !playerStats.totalStats.isGuardian) {
		playerStats.totalStats.isGuardian = true;
		const perRatio = randomElementFromArray([
			calcPercentRatio(15, card.rank),
			calcPercentRatio(17, card.rank),
		]);
		const ratio = getRelationalDiff(
			playerStats.totalStats.defense,
			perRatio
		);
		const defInc = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			perRatio
		);
		playerStats.totalStats.strength = playerStats.totalStats.strength + ratio;
		if (playerStats.totalStats.strength > playerStats.totalStats.originalHp) {
			playerStats.totalStats.strength = playerStats.totalStats.originalHp;
			if (playerStats.totalStats.isBleeding) playerStats.totalStats.isBleeding = false;
		}
		playerStats.totalStats.defense = playerStats.totalStats.defense + defInc;
		const desc = `restores __${ratio}__ ${emoji.heal} **HP**, and also increases ` +
        `the **DEF** of all allies by __${perRatio}%__`;
		damageDiff = relativeDiff(playerStats.totalStats.strength, playerStats.totalStats.originalHp);

		const processedHpBar = processHpBar(playerStats.totalStats, damageDiff);
		playerStats.totalStats.health = processedHpBar.health;
		playerStats.totalStats.strength = processedHpBar.strength;
 

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
			basePlayerStats
		}); 
	}
	return {
		playerStats,
		opponentStats,
		damageDiff 
	};
};
