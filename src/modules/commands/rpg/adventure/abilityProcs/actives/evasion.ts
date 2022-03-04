import { BattleProcessProps } from "@customTypes/adventure";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";

export const evasion = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card, 
}: BattleProcessProps) => {
	if (!card) return;
	playerStats.totalStats.previousRound ? playerStats.totalStats.previousRound++ : 0;
	if (round === playerStats.totalStats.previousRound) {
		playerStats.totalStats.isUseEvasion = false;
	}
	// increase evasion of all allies by __20%__ as well as increasing its **SPD** by __15%__
	if (round % 2 === 0 && !playerStats.totalStats.isUseEvasion) {
		playerStats.totalStats.isUseEvasion = true;
		playerStats.totalStats.previousRound = round;
		if (!basePlayerStats.totalStats.evasionTemp) basePlayerStats.totalStats.evasionTemp = 1;
		const percent = calcPercentRatio(20, card.rank);
		const ratio =
        basePlayerStats.totalStats.evasion * ((basePlayerStats.totalStats.evasionTemp * percent) / 100);
		basePlayerStats.totalStats.evasionTemp++;
		playerStats.totalStats.evasion = basePlayerStats.totalStats.evasion + ratio;
		const desc = `increasing its **Evasion Chance** by __${percent}%__`;
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
	return {
		playerStats,
		opponentStats 
	};
};
