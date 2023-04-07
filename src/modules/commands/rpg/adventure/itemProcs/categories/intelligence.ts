import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { probability, randomElementFromArray } from "helpers";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { compare, getRelationalDiff } from "helpers/battle";
import { AGNUS_SCEPTER_DEFAULT_HP_GAIN, AGNUS_SCEPTER_MAX_HP_GAIN } from "helpers/constants";
import { clone } from "utility";
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
		const desc = "Its **INT** is increased by __135__ points. " +
		"**Ability:** Reduce enemy **Crit Chance** by __15__%.";

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
	if (round % 2 === 0 && opponentStats.totalStats.critical > 1) {
		opponentStats.totalStats.critical = opponentStats.totalStats.critical - .15;
		if (opponentStats.totalStats.critical < 1) opponentStats.totalStats.critical = 1;
	}
	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
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
		const desc = `It's **INT** is increased by __110__ points. **Ability:** Grants __${itemStats.resist}%__ ` +
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
    
		const desc = "It's **INT** is increased by __125__ points as well as buffing its resistance against " +
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

export const agnusScepter = ({
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
		const hasMoreHp = compare(playerStats.totalStats.strength, opponentStats.totalStats.strength);
		let hpGain = AGNUS_SCEPTER_DEFAULT_HP_GAIN;
		if (hasMoreHp) {
			const diff = playerStats.totalStats.strength - opponentStats.totalStats.strength;
			hpGain = getRelationalDiff(diff, 200);
		}
		if (hpGain > AGNUS_SCEPTER_MAX_HP_GAIN) {
			hpGain = AGNUS_SCEPTER_DEFAULT_HP_GAIN;
		}
		if (!playerStats.totalStats.originalHp || !opponentStats.totalStats.originalHp) return;
		playerStats.totalStats.originalHp = playerStats.totalStats.originalHp + hpGain;
		opponentStats.totalStats.originalHp = opponentStats.totalStats.originalHp - hpGain;
		const desc = `and has gained __${card.itemStats.intelligence}__ **INT** ` +
		`**Ability:** Increase max **HP** of all allies by __${hpGain}__, and ` +
		"simultaneously reduce max **HP** of the enemy by the same amount.";
		// "**Ability:** Gain max **HP** equal to __200%__ of the difference between the enemy and ally max **HP's**" +
		// `, and simultaneously reduce their **HP** by the same amount up to __${AGNUS_SCEPTER_MAX_HP_GAIN}__ **HP**`;

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
			basePlayerStats,
			opponentStats
		};
	}
};