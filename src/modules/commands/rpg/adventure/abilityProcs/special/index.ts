import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import emoji from "emojis/emoji";
import { probability } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff } from "helpers/battle";

export const harbingerOfDeath = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
}: BattleProcessProps) => {
	// Nullify all effects resetting critical, elemental advantage
	// and critical damage
	// as well as reducing all stats by {15}% as well as buffing all
	// ally stats for the same %
	if (!card) return;
	let proc = true;
	if (opponentStats.totalStats.restringHarbingerOfDeathPercent) {
		const chances = [ opponentStats.totalStats.restringHarbingerOfDeathPercent, 100 ];
		const resistChances = [ false, true ];
		proc = resistChances[probability(chances)];
	}
	if (round % 4 === 0 && !playerStats.totalStats.isHarbingerOfDeath && proc) {
		playerStats.totalStats.isHarbingerOfDeath = true;
		const percent = calcPercentRatio(15, card.rank);
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
		opponentStats.totalStats.isEvadeHit = false;
		opponentStats.totalStats.isCriticalHit = false;
		
		playerStats.totalStats.isEvadeHit = false;
		playerStats.totalStats.isEvadeHit = false;
		playerStats.totalStats.critical = 1;
		playerStats.totalStats.criticalDamage = 1;
		playerStats.totalStats.criticalInc = 1;
		playerStats.totalStats.criticalTemp = 1;
		playerStats.totalStats.evasion = 1;
		playerStats.totalStats.evasionInc = 1;
		playerStats.totalStats.evasionTemp = 1;

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
			playerStats.totalStats[key] = playerStats.totalStats[key] + statGain;
		});
		const desc = "Nullifying all **Stack Effects**, disabling **Elemental Advantage** " +
	    "and resetting enemy **Critical Hit** and **Evasion Chance**, " +
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
