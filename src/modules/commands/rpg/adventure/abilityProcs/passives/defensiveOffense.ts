import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff } from "helpers/battle";

export const lastStand = async ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation,
	basePlayerStats
}: BattleProcessProps) => {
	if (!card || !playerStats.totalStats.originalHp) return;
	// if your HP is below 25% gain 10% ATK, if below 50% gain 5% DEF
	const fiftyPercentHp = Math.floor(
		playerStats.totalStats.originalHp * (50 / 100)
	);
	const twentyFivePercentHp = Math.floor(
		playerStats.totalStats.originalHp * (25 / 100)
	);
	if (
		(playerStats.totalStats.strength <= fiftyPercentHp ||
      playerStats.totalStats.strength <= twentyFivePercentHp) &&
        !playerStats.totalStats.isLastStand
	) {
		let gain = "defense";
		let num = 5;
		if (playerStats.totalStats.strength <= twentyFivePercentHp) {
			num = 10;
			gain = "vitality";
		}
		playerStats.totalStats.isLastStand = true;
		const percent = calcPercentRatio(num, card.rank);
		const key = gain as keyof CharacterStatProps;
		const ratio = getRelationalDiff(basePlayerStats.totalStats[key], percent);
		playerStats.totalStats[key] = playerStats.totalStats[key] + ratio;
		const desc = `increasing **${gain === "vitality" ? "ATK" : "DEF"}** of all allies by __${percent}%__`;
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
		opponentStats,
	};
};
