import { BattleProcessProps } from "@customTypes/adventure";
import { randomElementFromArray } from "helpers";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { processItemStats } from "..";

export const sapphiresStaff = ({
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
		const desc = "**Ability:** Grants additional (+60) **INT** points.";

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

export const seekersArmguard = ({
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
		playerStats.totalStats.restringHarbingerOfDeathPercent = card.itemStats.resist;
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "Gaining additional (+40) **INT** points. **Ability:** Buff your allies __+35__ **DEF** points, " +
		`as well as Grants __${card.itemStats.resist}%__ resistance against **Harbinger of Death**`;

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
	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
};

export const farsightOrb = ({
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
		const desc = "Its **INT** is increased by __35__ points. **Ability:** Grants __9%__ **CRIT Chance**.";

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

export const lunarWand = ({
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
		const itemStats = card.itemStats;
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		playerStats.totalStats.sleepResistPercent = itemStats.resist;
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = `It's **INT** is increased by __30__ points. **Ability:** Grants __${itemStats.resist}%__ ` +
        "resistance buff against **SLEEP** ability.";
        
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

export const staffOfMedana = ({
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
		const itemStats = card.itemStats;
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		const resistAgainst = randomElementFromArray([ "sleep", "restrict" ]);
		if (resistAgainst === "sleep") {
			playerStats.totalStats.sleepResistPercent = itemStats.resist;
		} else if (resistAgainst === "restrict") {
			playerStats.totalStats.restrictResistPercent = itemStats.resist;
		}
		basePlayerStats.totalStats = playerStats.totalStats;
    
		const desc = "It's **INT** is increased by __25__ points as well as buffing its resistance against " +
        `**${resistAgainst.toUpperCase()}** by __${itemStats.resist}%__`;

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