import { BattleProcessProps } from "@customTypes/adventure";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
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
		const desc = `and has gained __${itemStats.vitality}__ **ATK** ` +
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
		});
        
		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};
