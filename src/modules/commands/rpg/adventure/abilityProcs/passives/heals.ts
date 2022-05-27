import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";

export const surge = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation
}: BattleProcessProps) => {
	if (!card || !playerStats.totalStats.originalHp) return;
	// Need to rewird
	// When your hp is below __45%__. Increase life steal of all alies by __75__% 
	// as well as applying a bleed on the enemy dealing more damage over time.
	let desc;
	const perStr = getRelationalDiff(playerStats.totalStats.originalHp, 45);
	if (playerStats.totalStats.strength <= perStr && !playerStats.totalStats.isSurge) {
		playerStats.totalStats.isSurge = true;
		const percent = calcPercentRatio(75, card.rank);
		playerStats.totalStats.surgePercent = percent;

		const defBuffPercent = calcPercentRatio(8, card.rank);
		const defIncreaseRatio = getRelationalDiff(playerStats.totalStats.defense, defBuffPercent);
		playerStats.totalStats.defense = playerStats.totalStats.defense + defIncreaseRatio;
		desc = `Increasing **lifesteal** ${emoji.bloodsurge} of all allies by __${percent}%__`;
		// as well as ` +
		// 	`buffing its **DEF** by __${defBuffPercent}%__`;

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
	return {
		playerStats,
		opponentStats
	};
};

export const chronobreak = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation
}: BattleProcessProps) => {
	// tempora rewind restoring hp and enemy is caught in time dialation taking 20% damage
	if (!card ||  !playerStats.totalStats.originalHp || !opponentStats.totalStats.originalHp) return;
	let abilityDamage, opponentDamageDiff;
	if (round % 3 === 0) {
		let restoredHp = (playerStats.totalStats.previousHp || 0) - playerStats.totalStats.strength;
		if (restoredHp < 0 || isNaN(restoredHp)) restoredHp = 0;
		// need to make abilities based on ranks
		// let restore = Math.round(restoredHp * .8);
		// playerStats.strength = playerStats.strength + restore;
		playerStats.totalStats.strength = playerStats.totalStats.strength + restoredHp;
		const damageDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);
		const processedHpBar = processHpBar(playerStats.totalStats, damageDiff);
		playerStats.totalStats.health = processedHpBar.health;
		playerStats.totalStats.strength = processedHpBar.strength;

		const percent = calcPercentRatio(15, card.rank);
		abilityDamage = getRelationalDiff(
			opponentStats.totalStats.vitality,
			percent
		);
		opponentStats.totalStats.strength =
        opponentStats.totalStats.strength - abilityDamage;
		if (opponentStats.totalStats.strength <= 0)
			opponentStats.totalStats.strength = 0;
		opponentDamageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (opponentDamageDiff <= 0) opponentDamageDiff = 0;
		const processedOpponentHpBar = processHpBar(opponentStats.totalStats, opponentDamageDiff);
		opponentStats.totalStats.health = processedOpponentHpBar.health;
		opponentStats.totalStats.strength = processedOpponentHpBar.strength;

		const desc = `causing a temporal rewind restoring __${restoredHp}__ **HP**. ` +
		`${opponentStats.name} is struck by **Time Dilation** taking __${abilityDamage}__ Damage.`;
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
	if (round % 2 === 0) {
		playerStats.totalStats.previousHp = playerStats.totalStats.strength;
	}
	return {
		playerStats,
		opponentStats 
	};
};