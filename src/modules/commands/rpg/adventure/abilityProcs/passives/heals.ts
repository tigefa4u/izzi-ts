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
		});

		return {
			playerStats,
			opponentStats
		};
	}
};

export const chronobreak = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,	
}: BattleProcessProps) => {
	if (!card ||  !playerStats.totalStats.originalHp) return;
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
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;
		const desc = `causing a temporal rewind restoring __${restoredHp}__ **HP**`;
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
	if (round % 2 === 0) {
		playerStats.totalStats.previousHp = playerStats.totalStats.strength;
	}
	return {
		playerStats,
		opponentStats 
	};
};