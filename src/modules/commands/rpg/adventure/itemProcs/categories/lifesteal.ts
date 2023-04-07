import { BattleProcessProps } from "@customTypes/adventure";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { probability } from "helpers";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { titleCase } from "title-case";
import { processItemStats } from "..";

export const bloodthirster = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		const itemStats = card.itemStats;
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			itemStats
		);
		playerStats.totalStats.isLifesteal = true;
		playerStats.totalStats.lifestealPercent = 20;
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      `and has gained __${itemStats.vitality}__ **ATK** ` +
      "**Ability:** Increase the **CRIT Chance** and lifesteal of all allies by __20%__";

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
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const vampiresBlade = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	if (round === 1) {
		const itemStats = card.itemStats;
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      `and has gained __${itemStats.defense}__ **DEF** ` +
      "**Ability:** On **R3**, Gain a chance to strike the enemy with " +
      `**${titleCase(card.itemname || "")}** ${emojiMap(
      	card.itemname || ""
      )} increasing the lifesteal of all allies by __65%__`;

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
		});
		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	} else if (round === 3) {
		const procChance = [ true, false ][probability([ 35, 100 ])];
		if (procChance) {
			playerStats.totalStats.isLifesteal = true;
			playerStats.totalStats.lifestealPercent =
        (playerStats.totalStats.lifestealPercent || 0) + 65;
			const desc =
        `**${opponentStats.name}** was affected by ` +
        `**${titleCase(card.itemname || "")}** ${emojiMap(
        	card.itemname || ""
        )} ` +
        "increasing lifesteal of all allies by __65%__";
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
			});
			return {
				playerStats,
				opponentStats,
				basePlayerStats
			};
		}
	}
	return;
};
