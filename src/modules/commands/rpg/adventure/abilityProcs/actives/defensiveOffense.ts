import { BattleProcessProps } from "@customTypes/adventure";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { compare, getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";

export const defensiveStrike = async ({
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