import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import emoji from "emojis/emoji";
import { probability } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff } from "helpers/battle";
import { HARBINGER_OF_DEATH_PROC_ROUND } from "helpers/constants";

export const harbingerOfDeath = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation
}: BattleProcessProps) => {
	// Nullify all effects resetting critical, elemental advantage
	// and critical damage
	// as well as reducing all stats by {10}% as well as buffing all
	// ally stats for 14%
	if (!card) return;
	let proc = true;
	if (opponentStats.totalStats.resistingHarbingerOfDeathPercent) {
		const chances = [ opponentStats.totalStats.resistingHarbingerOfDeathPercent, 100 ];
		const resistChances = [ false, true ];
		proc = resistChances[probability(chances)];
	}
	if (round % HARBINGER_OF_DEATH_PROC_ROUND === 0 && !playerStats.totalStats.isHarbingerOfDeath && proc) {
		playerStats.totalStats.isHarbingerOfDeath = true;
		const percent = calcPercentRatio(14, card.rank);
		// const percentLoss = calcPercentRatio(10, card.rank);
		// reset elemental advantage
		// opponentStats.totalStats.effective = 1;
		// playerStats.totalStats.effective = 1;

		// opponentStats.totalStats.critical = 1;
		// opponentStats.totalStats.criticalDamage = 1;
		// opponentStats.totalStats.criticalInc = 1;
		// opponentStats.totalStats.criticalTemp = 1;
		opponentStats.totalStats.evasion = 1;
		opponentStats.totalStats.evasionInc = 1;
		opponentStats.totalStats.evasionTemp = 1;
		opponentStats.totalStats.isEvadeHit = false;
		// opponentStats.totalStats.isCriticalHit = false;

		// playerStats.totalStats.isEvadeHit = false;
		// playerStats.totalStats.isEvadeHit = false;
		// playerStats.totalStats.critical = 1;
		// playerStats.totalStats.criticalDamage = 1;
		// playerStats.totalStats.criticalInc = 1;
		// playerStats.totalStats.criticalTemp = 1;
		// playerStats.totalStats.evasion = 1;
		// playerStats.totalStats.evasionInc = 1;
		// playerStats.totalStats.evasionTemp = 1;

		// Nullify all effects
		playerStats.totalStats.isStunned = false;
		playerStats.totalStats.isPoisoned = false;
		playerStats.totalStats.isAsleep = false;
		playerStats.totalStats.isStackTB = false;
		playerStats.totalStats.isRestrictResisted = false;
		opponentStats.totalStats.isEndure = false;
		playerStats.totalStats.isBleeding = false;
		playerStats.totalStats.isToxic = false;

		[ "vitality", "defense", "dexterity", "intelligence" ].map((stat) => {
			const key = stat as keyof CharacterStatProps;
			// const statLoss = getRelationalDiff(
			// 	opponentStats.totalStats[key],
			// 	percentLoss
			// );
			// opponentStats.totalStats[key] = opponentStats.totalStats[key] - statLoss;

			const statGain = getRelationalDiff(playerStats.totalStats[key], percent);
			playerStats.totalStats[key] = playerStats.totalStats[key] + statGain;
		});
		const desc = "Nullifying all **Stack Effects**, resetting **Evasion Chance**, " +
	    `${emoji.harbingerofdeath} as well as ` +
	    `buffing all **Ally Ability Stats** by __${percent}%__`;
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
	if (playerStats.totalStats.isHarbingerOfDeath && opponentStats.totalStats.canEvadeHarbingerOfDeath) {
		opponentStats.totalStats.evasion = 1.32;
		const desc = `${playerStats.name}'s **${card.name}** is affected by ${emoji.seekersarmguard} ` +
		"**Seekers Armguard** increasing " +
		`**EVASION** chances of ${opponentStats.name} by __32%__`;
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
	return {
		playerStats,
		opponentStats,
	};
};
