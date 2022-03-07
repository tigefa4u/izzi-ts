import { BattleProcessProps } from "@customTypes/adventure";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";

export const balancingStrike = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
}: BattleProcessProps) => {
	if (
		!card ||
    !playerStats.totalStats.originalHp ||
    !opponentStats.totalStats.originalHp
	)
		return;
	// Deal elemental damage equal to __25%__ of your ATK as true damage, and take 1/3 of 
	// the damage dealt to yourself. If your enemy is stunned you deal __15%__ more damage.
	let damageDiff;
	let abilityDamage;
	let playerDamageDiff;
	if (round % 2 === 0 && !playerStats.totalStats.isBstrike) {
		playerStats.totalStats.isBstrike = true;
		let num = 25;
		if (opponentStats.totalStats.isStunned) {
			num = 40;
		}
		const percent = calcPercentRatio(num, card.rank);
		const relDiff = getRelationalDiff(playerStats.totalStats.vitality, percent);
		const damageDealt = relDiff;
		abilityDamage = damageDealt;
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - damageDealt;
		if (opponentStats.totalStats.strength <= 0)
			opponentStats.totalStats.strength = 0;
		const reflect = Math.round(damageDealt * (1 / 3));
		playerStats.totalStats.strength = playerStats.totalStats.strength - reflect;
		if (playerStats.totalStats.strength <= 0)
			playerStats.totalStats.strength = 0;
		playerDamageDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);
		let opponentDamageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (opponentDamageDiff <= 0) opponentDamageDiff = 0;
		if (playerDamageDiff <= 0) playerDamageDiff = 0;

		const processedPlayerHpBar = processHpBar(playerStats.totalStats, playerDamageDiff);
		playerStats.totalStats.health = processedPlayerHpBar.health;
		playerStats.totalStats.strength = processedPlayerHpBar.strength;

		const processedOpponentHpBar = processHpBar(opponentStats.totalStats, opponentDamageDiff);
		opponentStats.totalStats.health = processedOpponentHpBar.health;
		opponentStats.totalStats.strength = processedOpponentHpBar.strength;

		if (opponentDamageDiff <= 0) damageDiff = 0;
		const desc = `Dealing __${damageDealt}__ damage to **__${opponentStats.name}__** and takes __${reflect}__ ` +
        "damage on itself.";

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
		damageDiff,
		abilityDamage,
		playerDamageDiff,
	};
};
