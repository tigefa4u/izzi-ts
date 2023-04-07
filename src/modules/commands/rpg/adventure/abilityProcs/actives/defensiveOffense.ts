import { BattleProcessProps } from "@customTypes/adventure";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
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
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	// Deal 10% (12% if less speed) damage based on your defense
	// Will stack
	let damageDiff;
	let abilityDamage;
	if (round % 3 === 0) {
		let num = 10;
		const hasMoreSpeed = compare(
			playerStats.totalStats.dexterity,
			opponentStats.totalStats.dexterity
		);
		if (!hasMoreSpeed) {
			num = 12;
		}
		const percent = calcPercentRatio(num, card.rank);
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

		const desc = `Dealing __${abilityDamage}__ damage to **__${opponentStats.name}__**`;
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
		});
	}
	return {
		damageDiff,
		playerStats,
		opponentStats,
		abilityDamage
	};
};

export const lighteningShield = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	let damageDiff;
	let abilityDamage;
	// gain 30% DEF buff and reflect 10% damage based on enemy atk
	// decrease acc and crit damage by 15%
	if (round % 3 === 0 && !playerStats.totalStats.isLighteningShield) {
		playerStats.totalStats.isLighteningShield = true;
		const percent = calcPercentRatio(30, card.rank);
		const defRatio = getRelationalDiff(basePlayerStats.totalStats.defense, percent);
		playerStats.totalStats.defense = playerStats.totalStats.defense + defRatio;

		const atkPercent = calcPercentRatio(10, card.rank);
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

		const desc = `Increasing its **DEF** by __${percent}%__ ` +
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
		}); 
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage
	}; 
};