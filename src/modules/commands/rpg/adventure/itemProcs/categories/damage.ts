import { BattleProcessProps } from "@customTypes/adventure";
import { probability } from "helpers";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { processItemStats } from "..";

export const duskbladeOfDraktharr = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      "**Ability:** Grants an additional **(75 + 30% bonus ATK Damage)**";

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
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const youmuusGhostblade = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      "it's **ATK** is increased by __60__ points and **EVA** by __12%__.";

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
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const navoriQuickblades = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
        "**Ability:** Grants **(+60 ATK Damage)** and __20%__ **CRIT Chance**";

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
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const desolator = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "**Ability:** Your attacks reduce the enemy's **DEF** by __(-6)__ points))";

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
		});
	}
	opponentStats.totalStats.defense = opponentStats.totalStats.defense - 6;

	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
};

export const stormrazor = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
        "**Ability:** Grants a chance to **Paralyze** the enemy";

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
		});
	}
	if (playerStats.totalStats.isStunned || opponentStats.totalStats.isStunned) {
		playerStats.totalStats.isStunned = false;
		opponentStats.totalStats.isStunned = false;
	}
	const stunChance = [ 5, 95 ];
	const stuns = [ true, false ];
	if (stuns[probability(stunChance)]) {
		opponentStats.totalStats.isStunned = true;
		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: `**${opponentStats.name}** is __Stunned__, affected by **Stormrazor**`,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
		}); 
	}

	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
};

export const krakenSlayer = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "**Ability:** Buff **Stats** of all allies by __80__ Points.";

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
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};