import { BattleProcessProps } from "@customTypes/adventure";
import { calcPercentRatio } from "helpers/ability";
import { calculateSkillProcRound, prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { compare, getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";

export const defensiveStrike = ({
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
	if (!card || !opponentStats.totalStats.originalHp) return;
	// Deal 10% (12% if less speed) damage based on your defense
	// Will stack, inc def of all allies by 10%
	let damageDiff;
	let abilityDamage;
	const procRound = calculateSkillProcRound(3, card.reduceSkillCooldownBy);
	if (round % procRound === 0) {
		let num = 25;
		const hasMoreSpeed = compare(
			playerStats.totalStats.dexterity,
			opponentStats.totalStats.dexterity
		);
		if (!hasMoreSpeed) {
			num = 30;
		}
		const percent = calcPercentRatio(num, card.rank);
		const incPercent = calcPercentRatio(20, card.rank);
		const inc = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			incPercent
		);
		basePlayerStats.totalStats.defense = basePlayerStats.totalStats.defense + inc;
		const defInc = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			incPercent
		);
		playerStats.totalStats.defense = playerStats.totalStats.defense + defInc;

		const damageDealt = getRelationalDiff(
			playerStats.totalStats.defense,
			percent
		);
		abilityDamage = damageDealt;
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - damageDealt;
		if (opponentStats.totalStats.strength <= 0)
			opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(opponentStats.totalStats.strength, opponentStats.totalStats.originalHp);

		if (damageDiff <= 0) damageDiff = 0;
		const processedOpponentHpBar = processHpBar(
			opponentStats.totalStats,
			damageDiff
		);
		opponentStats.totalStats.health = processedOpponentHpBar.health;
		opponentStats.totalStats.strength = processedOpponentHpBar.strength;

		const desc = `Increasing **Base DEF and DEF** of all allies by __${incPercent}%__ ` +
		`as well as dealing __${abilityDamage}__ damage to **__${opponentStats.name}__**`;
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
		damageDiff,
		playerStats,
		opponentStats,
		abilityDamage
	};
};

export const lightningShield = ({
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
	if (!card || !opponentStats.totalStats.originalHp) return;
	let damageDiff;
	let abilityDamage;
	// gain 30% DEF buff and reflect 10% damage based on enemy atk
	// decrease acc and crit damage by 15%
	const procRound = calculateSkillProcRound(2, card.reduceSkillCooldownBy);
	if (round % procRound === 0 && !playerStats.totalStats.isLightningShield) {
		playerStats.totalStats.isLightningShield = true;
		const percent = calcPercentRatio(30, card.rank);
		const baseRatio = getRelationalDiff(basePlayerStats.totalStats.defense, percent);
		basePlayerStats.totalStats.defense = basePlayerStats.totalStats.defense + baseRatio;
		const defRatio = getRelationalDiff(basePlayerStats.totalStats.defense, percent);
		playerStats.totalStats.defense = playerStats.totalStats.defense + defRatio;

		const atkPercent = calcPercentRatio(25, card.rank);
		abilityDamage = getRelationalDiff(opponentStats.totalStats.vitality, atkPercent);
		opponentStats.totalStats.strength =
        opponentStats.totalStats.strength - abilityDamage;
		if (opponentStats.totalStats.strength <= 0)
			opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(opponentStats.totalStats.strength, opponentStats.totalStats.originalHp);
  
		if (damageDiff <= 0) damageDiff = 0;
		const processedOpponentHpBar = processHpBar(
			opponentStats.totalStats,
			damageDiff
		);
		opponentStats.totalStats.health = processedOpponentHpBar.health;
		opponentStats.totalStats.strength = processedOpponentHpBar.strength;

		opponentStats.totalStats.accuracy = opponentStats.totalStats.accuracy - .15;
		if (opponentStats.totalStats.accuracy < 0) opponentStats.totalStats.accuracy = 0;
		opponentStats.totalStats.criticalDamage = opponentStats.totalStats.criticalDamage - .15;
		if (opponentStats.totalStats.criticalDamage < 0) opponentStats.totalStats.criticalDamage = 0;

		const desc = `Increasing its **Base DEF** and **DEF** by __${percent}%__ ` +
        `as well as dealing __${abilityDamage}__ damage to **__${opponentStats.name}__**, simultaneously ` +
        "decreasing its **Accuracy** and **Crit Damage** by __15%__";
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
		damageDiff,
		abilityDamage
	}; 
};

export const transfigure = ({
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
	// Decrease SPD of all allies by 10% simultaneously increasing their max HP and max DEF by 15%.
	if (!card || !playerStats.totalStats.originalHp || !basePlayerStats.totalStats.originalHp) return;	
	const prodRound = calculateSkillProcRound(3, card.reduceSkillCooldownBy);
	if (round % prodRound === 0) {
		const spdPercent = calcPercentRatio(10, card.rank);
		const spdRatio = getRelationalDiff(
			basePlayerStats.totalStats.dexterity,
			spdPercent
		);
		playerStats.totalStats.dexterity = playerStats.totalStats.dexterity - spdRatio;

		const incPercent = calcPercentRatio(15, card.rank);
		const hpRatio = getRelationalDiff(playerStats.totalStats.originalHp, incPercent);
		const defRatio = getRelationalDiff(basePlayerStats.totalStats.defense, incPercent);
		basePlayerStats.totalStats.defense = basePlayerStats.totalStats.defense + defRatio;
		basePlayerStats.totalStats.strength = basePlayerStats.totalStats.strength + hpRatio;

		const cap = basePlayerStats.totalStats.originalHp + Math.ceil(basePlayerStats.totalStats.originalHp / 2);

		if (playerStats.totalStats.originalHp < cap) {
			playerStats.totalStats.originalHp = playerStats.totalStats.originalHp + hpRatio;
		}

		const diff = relativeDiff(playerStats.totalStats.strength, playerStats.totalStats.originalHp);
		const processedHpBar = processHpBar(
			playerStats.totalStats,
			diff	
		);
		playerStats.totalStats.health = processedHpBar.health;
		playerStats.totalStats.strength = processedHpBar.strength;
		const desc = `Decreasing **SPD** of all allies by __${spdPercent}%__, simultaneously increase their ` +
		`**Max HP** and **Base DEF** by __${incPercent}%__.`;
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