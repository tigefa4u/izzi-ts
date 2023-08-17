import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	getPercentOfTwoNumbers,
	getRelationalDiff,
	processEnergyBar,
} from "helpers/battle";

export const leer = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation,
	baseEnemyStats,
	basePlayerStats,
}: BattleProcessProps) => {
	if (!card) return;
	if (opponentStats.totalStats.isParanoid) {
		opponentStats.totalStats.isParanoid = false;
	}
	// Reduce DEF/INT of enemy by 25%, apply stack of paranoia for 1 round
	// inc own int by 25%
	if (round % 3 === 0 && !playerStats.totalStats.isLeer) {
		playerStats.totalStats.isLeer = true;
		opponentStats.totalStats.isParanoid = true;
		const percent = calcPercentRatio(25, card.rank);
		const defRatio = getRelationalDiff(
			baseEnemyStats.totalStats.defense,
			percent
		);
		const intRation = getRelationalDiff(
			baseEnemyStats.totalStats.intelligence,
			percent
		);
		opponentStats.totalStats.defense =
      opponentStats.totalStats.defense - defRatio;
		opponentStats.totalStats.intelligence =
      opponentStats.totalStats.intelligence - intRation;
	  if (opponentStats.totalStats.intelligence < 0) opponentStats.totalStats.intelligence = 0;
		const diff = getPercentOfTwoNumbers(
			opponentStats.totalStats.intelligence,
			baseEnemyStats.totalStats.intelligence
		);
		const opponentEnergy = processEnergyBar({
			dpr: diff,
			energy: opponentStats.totalStats.energy,
		});
		opponentStats.totalStats.energy = opponentEnergy.energy;
		opponentStats.totalStats.dpr = opponentEnergy.dpr;
		const desc =
      `inflicting a stack of **Paranoia** ${emoji.paranoid} on ` +
      `**__${opponentStats.name}__**, simultaneously ` +
      `decreasing its **DEF** and **INT** by __${percent}%__`;
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
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	}
	return {
		playerStats,
		opponentStats,
	};
};
