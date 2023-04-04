import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { compare, getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";

export const lastStand = async ({
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
	if (!card || !playerStats.totalStats.originalHp || !opponentStats.totalStats.originalHp) return;
	// if your HP is below 25% deal 15% Damage based on your DEF, if below 50% gain 10% DEF
	// if your int is more gain 12% def
	const fiftyPercentHp = Math.floor(
		playerStats.totalStats.originalHp * (50 / 100)
	);
	const twentyFivePercentHp = Math.floor(
		playerStats.totalStats.originalHp * (25 / 100)
	);
	let damageDiff;
	let abilityDamage;
	const strength = playerStats.totalStats.strength;
	if (strength <= twentyFivePercentHp && !playerStats.totalStats.isLastStand) {
		const percent = calcPercentRatio(15, card.rank);
		const damageDealt = getRelationalDiff(basePlayerStats.totalStats.defense, percent);

		opponentStats.totalStats.strength = opponentStats.totalStats.strength - damageDealt;
		abilityDamage = damageDealt;
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

		const desc = `dealing __${abilityDamage}__ damage to **${opponentStats.name}**`;
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
	} else if (strength <= fiftyPercentHp && !playerStats.totalStats.isLastStand) {
		let num = 10;
		const hasMoreInt = compare(playerStats.totalStats.intelligence, opponentStats.totalStats.intelligence);
		if (hasMoreInt) {
			num = 12;
		}
		const percent = calcPercentRatio(num, card.rank);
		const ratio = getRelationalDiff(basePlayerStats.totalStats.defense, percent);
		playerStats.totalStats.defense = playerStats.totalStats.defense + ratio;
		const desc = `increasing **DEF** of all allies by __${percent}%__`;
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
	if (!playerStats.totalStats.isLastStand) {
		playerStats.totalStats.isLastStand = true;
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage
	};
};
