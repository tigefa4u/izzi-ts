import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { numericWithComma, randomElementFromArray } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { calculateSkillProcRound, prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	getPercentOfTwoNumbers, getRelationalDiff, processEnergyBar, processHpBar, relativeDiff 
} from "helpers/battle";

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
	// Increase life steal by __25%__ and buff ATK by 15%.
	const procRound = calculateSkillProcRound(3, card.reduceSkillCooldownBy);
	if (round % procRound === 0 && !playerStats.totalStats.isLifestealProc) {
		playerStats.totalStats.isLifesteal = true;
		playerStats.totalStats.isLifestealProc = true;
		const percent = calcPercentRatio(23, card.rank);
		const atkPercent = calcPercentRatio(13, card.rank);
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
	const procRound = calculateSkillProcRound(3, card.reduceSkillCooldownBy);
	if (round % procRound === 0 && !playerStats.totalStats.isRevit) {
		playerStats.totalStats.isRevit = true;
		let missingHp = playerStats.totalStats.originalHp - playerStats.totalStats.strength;
		if (missingHp < 0) missingHp = 0;
		const percent = calcPercentRatio(58, card.rank);
		const restoreDiff = getRelationalDiff(missingHp, percent);
		let restorePoints = Math.ceil(playerStats.totalStats.strength + restoreDiff);
		if (restorePoints >= playerStats.totalStats.originalHp)
			restorePoints = playerStats.totalStats.originalHp;
		playerStats.totalStats.strength = restorePoints;
		// Use the same for all abilities that buff stats
		// buff stats from base stats
		const incPercent = calcPercentRatio(15, card.rank);
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
}: BattleProcessProps) => {
	let damageDiff;
	if (!card || !playerStats.totalStats.originalHp) return;
	// restore (25% - 30%) health  and also increase the __DEF__ & __ARM__ of all allies for the same %
	const procRound = calculateSkillProcRound(3, card.reduceSkillCooldownBy);
	if (round % procRound === 0 && !playerStats.totalStats.isGuardian) {
		playerStats.totalStats.isGuardian = true;
		const perRatio = randomElementFromArray([
			calcPercentRatio(25, card.rank),
			calcPercentRatio(30, card.rank),
		]);
		const defInc = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			perRatio
		);
		playerStats.totalStats.defense = playerStats.totalStats.defense + defInc;

		const intInc = getRelationalDiff(
			basePlayerStats.totalStats.intelligence,
			perRatio
		);
		playerStats.totalStats.intelligence = playerStats.totalStats.intelligence + intInc;

		const ratio = getRelationalDiff(
			playerStats.totalStats.originalHp,
			perRatio
		);

		playerStats.totalStats.strength = playerStats.totalStats.strength + ratio;
		let removeBleed = "";
		if (playerStats.totalStats.strength > playerStats.totalStats.originalHp) {
			let diff = Math.floor(playerStats.totalStats.strength - playerStats.totalStats.originalHp);

			if (diff > 0) {
				playerStats.totalStats.intelligence = playerStats.totalStats.intelligence + diff;
				let barDiff = getPercentOfTwoNumbers(
					playerStats.totalStats.intelligence,
					basePlayerStats.totalStats.intelligence
				);
				if (barDiff < 0 || isNaN(barDiff)) barDiff = 0;
				const energy = processEnergyBar({
					dpr: barDiff,
					energy: opponentStats.totalStats.energy,
				});
				playerStats.totalStats.dpr = energy.dpr;
				playerStats.totalStats.energy = energy.energy;
			} else {
				diff = 0;
			}

			playerStats.totalStats.strength = playerStats.totalStats.originalHp;
			playerStats.totalStats.isBleeding = false;
			playerStats.totalStats.isUseBleed = false;
			removeBleed = " [PSV] Overheal has stopped bleed and has " +
			`also gained __${numericWithComma(diff)}__ **ARMOR**.`;
		}
		const desc = `restores __${ratio}__ ${emoji.heal} **HP**, and also increases ` +
        `the **DEF** and **ARMOR** of all allies by __${perRatio}%__.${removeBleed}`;
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
