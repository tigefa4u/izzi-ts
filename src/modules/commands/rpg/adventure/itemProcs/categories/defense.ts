import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";
import { processItemStats } from "..";

export const blackCleaver = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		const itemStats = card.itemStats;
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      `and has gained additional __(+${itemStats.strength})__ **HP** and ` +
      `__(+${itemStats.vitality})__ **ATK** **Ability:** Dealing damage to enemies will now decrease their ` +
      "**DEF** by __4%__";

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
			isItem: true,
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	}
	const ratio = getRelationalDiff(opponentStats.totalStats.defense, 4);
	opponentStats.totalStats.defense = opponentStats.totalStats.defense - ratio;

	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
};

export const thornmail = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		const itemStats = card.itemStats;
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		playerStats.totalStats.isReflectThornmailDamage = true;
		const desc =
      `and has gained __${itemStats.strength}__ **HP** and __${itemStats.defense}__ **DEF** ` +
      "**Ability:** When struck by an Attack, deal (10 + 1% bonus Defense) damage to the attacker";

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
			isItem: true,
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	}
	let damageDiff, itemDamage;
	if (playerStats.totalStats.isReflectThornmailDamage && round !== 1) {
		if (
			!opponentStats.totalStats.originalHp ||
      isNaN(opponentStats.totalStats.originalHp)
		) {
			throw new Error("Unprocessable originalHp");
		}
		const randomDamage = randomNumber(300, 500);
		itemDamage = randomDamage;
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - randomDamage;
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (damageDiff <= 0) {
			damageDiff = 0;
		}
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;

		const desc = `**${opponentStats.name}** is affected by **Thornmail** ${emoji.thornmail}, ` +
		`taking __${randomDamage}__ damage upon itself!`;
		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: true,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	}

	return {
		playerStats,
		opponentStats,
		basePlayerStats,
		damageDiff,
		itemDamage,
	};
};

export const guardianAngel = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats.isGuardianAngel = true;
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      "**Ability:** Grants additional __500__ **HP** as well as (+120) **DEF** Points.";

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
			isItem: true,
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	}
	if (playerStats.totalStats.isBleeding) {
		playerStats.totalStats.isBleeding = false;
	}
	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
};
