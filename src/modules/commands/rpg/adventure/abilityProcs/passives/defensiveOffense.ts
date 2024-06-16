import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	compare, getPercentOfTwoNumbers, getRelationalDiff, processEnergyBar, processHpBar, relativeDiff 
} from "helpers/battle";

export const lastStand = ({
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
	if (!card || !playerStats.totalStats.originalHp || !opponentStats.totalStats.originalHp) return;
	/**
	 * When your hp is below 30%, increase DEF of all allies by 20%. Also
	 * regen 25% of missing armor.
	 * 
	 */ 
	const criteria = Math.floor(
		playerStats.totalStats.originalHp * .3
	);
	// const twentyFivePercentHp = Math.floor(
	// 	playerStats.totalStats.originalHp * (25 / 100)
	// );
	let damageDiff;
	let abilityDamage;
	let desc = "";
	const strength = playerStats.totalStats.strength;
	if (strength <= criteria && !playerStats.totalStats.isLastStand) {
		playerStats.totalStats.isLastStand = true;
		let missingArm = basePlayerStats.totalStats.intelligence - playerStats.totalStats.intelligence;
		if (missingArm < 0) missingArm = 0;
		const percent = calcPercentRatio(25, card.rank);
		const restoreArm = getRelationalDiff(missingArm, percent);
		playerStats.totalStats.intelligence = playerStats.totalStats.intelligence + restoreArm;

		const defPercent = calcPercentRatio(20, card.rank);
		const restoreDef = getRelationalDiff(basePlayerStats.totalStats.defense, defPercent);
		playerStats.totalStats.defense = playerStats.totalStats.defense + restoreDef;

		let diff = getPercentOfTwoNumbers(
			playerStats.totalStats.intelligence,
			basePlayerStats.totalStats.intelligence
		);
		if (diff < 0 || isNaN(diff)) diff = 0;
		const playerEnergy = processEnergyBar({
			dpr: diff,
			energy: playerStats.totalStats.energy,
		});
		playerStats.totalStats.dpr = playerEnergy.dpr;
		playerStats.totalStats.energy = playerEnergy.energy;

		desc = `Increasing **DEF** of all allies by __${defPercent}%__ also restoring ` +
		`__${restoreArm}__ **ARMOR**.`;
	}
	// if (strength <= fiftyPercentHp && !playerStats.totalStats.isLastStand) {
	// 	let num = 20;
	// 	const hasMoreDef = compare(opponentStats.totalStats.defense, playerStats.totalStats.defense);
	// 	if (hasMoreDef) {
	// 		num = 22;
	// 	}
	// 	const percent = calcPercentRatio(num, card.rank);
	// 	const ratio = getRelationalDiff(basePlayerStats.totalStats.defense, percent);
	// 	playerStats.totalStats.defense = playerStats.totalStats.defense + ratio;
	// 	desc = `increasing **DEF** of all allies by __${percent}%__`;
	// }
	// if (strength <= twentyFivePercentHp && !playerStats.totalStats.isLastStand) {
	// 	const percent = calcPercentRatio(15, card.rank);
	// 	const damageDealt = getRelationalDiff(playerStats.totalStats.defense, percent);

	// 	opponentStats.totalStats.strength = opponentStats.totalStats.strength - damageDealt;
	// 	abilityDamage = damageDealt;
	// 	if (opponentStats.totalStats.strength <= 0)
	// 		opponentStats.totalStats.strength = 0;
	// 	damageDiff = relativeDiff(opponentStats.totalStats.strength, opponentStats.totalStats.originalHp);

	// 	if (damageDiff <= 0) damageDiff = 0;
	// 	const processedOpponentHpBar = processHpBar(
	// 		opponentStats.totalStats,
	// 		damageDiff
	// 	);
	// 	opponentStats.totalStats.health = processedOpponentHpBar.health;
	// 	opponentStats.totalStats.strength = processedOpponentHpBar.strength;

	// 	desc = desc + `, as well as dealing __${abilityDamage}__ damage to **${opponentStats.name}**`;
	// }
	// if (!playerStats.totalStats.isLastStand) {
	// 	playerStats.totalStats.isLastStand = true;
	// }
	if (desc !== "") {
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
