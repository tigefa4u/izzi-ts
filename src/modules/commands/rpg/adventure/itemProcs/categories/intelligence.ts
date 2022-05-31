import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { probability, randomElementFromArray } from "helpers";
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
	simulation
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "**Ability:** Grants additional (+60) **INT** points " +
		"as well as __25%__ chance to put the enemy to **SLEEP**";

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
			simulation
		});

	} else {
		if (opponentStats.totalStats.isAsleep) {
			const temp = [ true, false ];
			const wakeupProb = [ 55, 45 ];
			if (temp[probability(wakeupProb)]) {
				opponentStats.totalStats.isAsleep = false;
				const desc = `**__${opponentStats.name}__** has snapped out of ${emoji.sleep} **Sleep!**`;
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
					isItem: false,
					simulation
				});
			}
		}
		const sleepChance = [ 25, 100 ];
		const sleeps = [ true, false ];
		if (sleeps[probability(sleepChance)] && !opponentStats.totalStats.isAsleep) {
			playerStats.totalStats.previousRound = round;
			opponentStats.totalStats.isAsleep = true;
			prepSendAbilityOrItemProcDescription({
				playerStats,
				enemyStats: opponentStats,
				card,
				message,
				embed,
				round,
				isDescriptionOnly: false,
				description: `**${opponentStats.name}** is __Asleep__, affected by **Sapphire's Staff**`,
				totalDamage: 0,
				isPlayerFirst,
				isItem: true,
				simulation
			}); 
		}
	}
	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
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
	simulation
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		playerStats.totalStats.canEvadeHarbingerOfDeath = true;
		playerStats.totalStats.resistingHarbingerOfDeathPercent = card.itemStats.resist;
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "Gaining additional (+40) **INT** points. **Ability:** Buff your allies __+35__ **DEF** points, " +
		`as well as Grants __${card.itemStats.resist}%__ resistance as well as __32%__ **EVASION** ` + 
		"chances against **Harbinger of Death**.";

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
			simulation
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
	simulation
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "Its **INT** is increased by __35__ points. **Ability:** Grants __15%__ **CRIT Chance**.";

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
			simulation
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
	simulation
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
			simulation
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
	simulation
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
			simulation
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};