import { BattleProcessProps } from "@customTypes/adventure";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { compare, getRelationalDiff } from "helpers/battle";

export const pointBlank = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation
}: BattleProcessProps) => {
	if (!card) return;
	// Increase the accuracy of all allies by __35%__ as well as increasing crit chances by __30%__
	/**
	 * Increase acc & atk (20%)
	 */
	if (round % 3 === 0 && !playerStats.totalStats.isPB) {
		playerStats.totalStats.isPB = true;
		if (!basePlayerStats.totalStats.tempPB)
			basePlayerStats.totalStats.tempPB = 1;
		const pbPercent = calcPercentRatio(30, card.rank);
		const crit = basePlayerStats.totalStats.critical * (pbPercent / 100);
		playerStats.totalStats.critical = playerStats.totalStats.critical + Number(crit.toFixed(2));
		const accPercent = calcPercentRatio(35, card.rank);
		const accuracy = basePlayerStats.totalStats.accuracy * (accPercent / 100);
		playerStats.totalStats.accuracy = playerStats.totalStats.accuracy + Number(accuracy.toFixed(2));
		if (isNaN(playerStats.totalStats.accuracy)) {
			playerStats.totalStats.accuracy = 1;
		}
		if (isNaN(playerStats.totalStats.critical)) {
			playerStats.totalStats.critical = 1;
		}

		const atkPercent = calcPercentRatio(20, card.rank);
		const atk = getRelationalDiff(basePlayerStats.totalStats.vitality, atkPercent);

		playerStats.totalStats.vitality = playerStats.totalStats.vitality + atk;

		const desc = `Increasing **CRIT Chances** by __${pbPercent}%__ as well as ` +
        `increasing its **ATK** by __${atkPercent}%__ and **ACC** by __${accPercent}%__`;
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
	if (round % 3 === 1 && playerStats.totalStats.isPB)
		playerStats.totalStats.isPB = false;
	return {
		playerStats,
		opponentStats,
	};
};

export const precision = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation
}: BattleProcessProps) => {
	if (!card) return;
	// Increase the crit chances of all allies by 40% as well as increasing crit damage of allies by __18%__.
	// need to change prec to be 18%
	if (!playerStats.totalStats.critNum) playerStats.totalStats.critNum = 2;
	if (
		round % playerStats.totalStats.critNum === 0 &&
    !playerStats.totalStats.isPrecision
	) {
		playerStats.totalStats.isPrecision = true;
		const hasMoreInt = compare(
			playerStats.totalStats.intelligence,
			opponentStats.totalStats.intelligence
		);
		const num = hasMoreInt ? 2 : 3;
		playerStats.totalStats.critNum = playerStats.totalStats.critNum + num;
		
		const percent = calcPercentRatio(40, card.rank);
		const crit = basePlayerStats.totalStats.critical * (percent / 100);

		playerStats.totalStats.critical = playerStats.totalStats.critical + Number(crit.toFixed(2));
		if (isNaN(playerStats.totalStats.critical)) {
			playerStats.totalStats.critical = 1;
		}

		const critPercent = calcPercentRatio(18, card.rank);
		const critDamage = basePlayerStats.totalStats.criticalDamage * (critPercent / 100);
		playerStats.totalStats.criticalDamage = playerStats.totalStats.criticalDamage + Number(critDamage.toFixed(2));
		if (isNaN(playerStats.totalStats.criticalDamage)) {
			playerStats.totalStats.criticalDamage = 1;
		}
		const desc = "The **CRIT Damage** of all allies is increased to " +
        `__${playerStats.totalStats.criticalDamage.toFixed(
        	2
        )}__ as well as increasing its **CRIT Chance** by __${percent}%__`;
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
	if (round % 2 === 1 && playerStats.totalStats.isPrecision)
		playerStats.totalStats.isPrecision = false;
	return {
		playerStats,
		opponentStats,
	};
};

export const presenceOfMind = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation
}: BattleProcessProps) => {
	if (!card) return;
	// Increase the accuracy of all allies by __25%__ as well as decreasing the SPD of enemies 
	// by __14%__ and gain a crit chance of __20%__.
	let desc;
	if (!playerStats.totalStats.pomNum) playerStats.totalStats.pomNum = 2;
	if (round % playerStats.totalStats.pomNum === 0 && !playerStats.totalStats.isPOM) {
		playerStats.totalStats.isPOM = true;
		const temp = compare(playerStats.totalStats.dexterity, opponentStats.totalStats.dexterity);
		const num = temp ? 2 : 3;
		playerStats.totalStats.pomNum = playerStats.totalStats.pomNum + num;
		const accPercent = calcPercentRatio(25, card.rank);
		const acc = basePlayerStats.totalStats.accuracy * (accPercent / 100);
		playerStats.totalStats.accuracy = playerStats.totalStats.accuracy + acc;

		const dexPercent = calcPercentRatio(14, card.rank);
		const dex = opponentStats.totalStats.dexterity * (dexPercent / 100);
		opponentStats.totalStats.dexterity = Math.floor(opponentStats.totalStats.dexterity - dex);

		const critPercent = calcPercentRatio(20, card.rank);
		const crit = basePlayerStats.totalStats.critical * (critPercent / 100);
		playerStats.totalStats.critical = playerStats.totalStats.critical + crit;
		desc = `Decreasing ${opponentStats.name}'s **SPD** by __${dexPercent}%__ as well as increasing the ` +
        `**ACC** of all allies by __${accPercent}%__ and has also gained a **CRIT Chance** of __${critPercent}%__`;
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
	if (round % 2 === 1 && playerStats.totalStats.isPOM) playerStats.totalStats.isPOM = false;
	return {
		playerStats,
		opponentStats 
	};
};
