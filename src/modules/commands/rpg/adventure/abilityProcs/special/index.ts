import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import emoji from "emojis/emoji";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff } from "helpers/battle";

export const harbinderOfDeath = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
}: BattleProcessProps) => {
	// Nullify all effects resetting critical, evasion, elemental advantage
	// and critical damage
	// as well as reducing all stats by {20}% as well as buffing all
	// ally stats for the same %
	if (!card) return;
	if (round % 4 === 0 && !playerStats.totalStats.isHarbingerOfDeath) {
		const percent = calcPercentRatio(20, card.rank);
		// reset elemental advantage
		opponentStats.totalStats.effective = 1;
		playerStats.totalStats.effective = 1;

		opponentStats.totalStats.critical = 1;
		opponentStats.totalStats.criticalDamage = 1;
		opponentStats.totalStats.criticalInc = 1;
		opponentStats.totalStats.criticalTemp = 1;
		opponentStats.totalStats.evasion = 1;
		opponentStats.totalStats.evasionInc = 1;
		opponentStats.totalStats.evasionTemp = 1;

		// Nullify all effects
		playerStats.totalStats.isStunned = false;
		playerStats.totalStats.isPoisoned = false;
		playerStats.totalStats.isAsleep = false;
		playerStats.totalStats.isStackTB = false;
		playerStats.totalStats.isRestrictResisted = false;
		opponentStats.totalStats.isEndure = false;

		[ "vitality", "defense", "dexterity", "intelligence" ].map((stat) => {
			const key = stat as keyof CharacterStatProps;
			const statLoss = getRelationalDiff(
				opponentStats.totalStats[key],
				percent
			);
			opponentStats.totalStats[key] = opponentStats.totalStats[key] - statLoss;

			const statGain = getRelationalDiff(playerStats.totalStats[key], percent);
			playerStats.totalStats[key] = playerStats.totalStats[key] - statGain;
		});
		const desc = "Nullifying all **Stack Effects**, disabling **Elemental Advantage** " +
	    "and resetting enemy **Critical Hit** and **Evasion** chances, " +
	    `${emoji.harbingerofdeath} as well as **Decreasing** all **Enemy Stats** by __${percent}%__ and ` +
	    `buffing all **Ally Stats** by __${percent}%__`;
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
		opponentStats,
	};
};
