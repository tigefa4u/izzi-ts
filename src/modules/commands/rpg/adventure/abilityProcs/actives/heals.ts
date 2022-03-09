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
}: BattleProcessProps) => {
	if (!card) return;
	// Increase life steal by __25%__.
	if (round % 3 === 0) {
		playerStats.totalStats.isLifesteal = true;
		const percent = calcPercentRatio(25, card.rank);
		playerStats.totalStats.lifestealPercent = playerStats.totalStats.lifestealPercent
			? playerStats.totalStats.lifestealPercent + percent
			: percent;
		const desc = `Increasing **lifesteal** of all allies by __${percent}%__`;
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
		if (!basePlayerStats.totalStats.vitalityTemp) basePlayerStats.totalStats.vitalityTemp = 1;
		playerStats.totalStats.vitality =
        playerStats.totalStats.vitality - (card.stats.vitalityInc || card.stats.vitality);
		const incPercent = calcPercentRatio(8, card.rank);
		const ratio =
    card.stats.vitality *
    ((basePlayerStats.totalStats.vitalityTemp * incPercent) / 100);
		basePlayerStats.totalStats.vitalityTemp = basePlayerStats.totalStats.vitalityTemp + 1;
		const inc = card.stats.vitality + ratio;
		card.stats.vitalityInc = inc;
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + inc;
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
	basePlayerStats
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
		if (!basePlayerStats.totalStats.tempGuardianCount)
			basePlayerStats.totalStats.tempGuardianCount = 1;
		const ratio = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			perRatio
		);
		basePlayerStats.totalStats.tempGuardianCount++;
		playerStats.totalStats.strength = playerStats.totalStats.strength + ratio;
		if (playerStats.totalStats.strength >= playerStats.totalStats.originalHp)
			playerStats.totalStats.strength = playerStats.totalStats.originalHp;
		playerStats.totalStats.defense = basePlayerStats.totalStats.defense + ratio;
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
		}); 
	}
	return {
		playerStats,
		opponentStats,
		damageDiff 
	};
};
