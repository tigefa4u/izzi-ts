import { BattleProcessProps } from "@customTypes/adventure";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { compare } from "helpers/battle";

export const pointBlank = ({
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
	// Increase the accuracy of all allies by __15%__ as well as increasing crit chances by __30%__
	if (round % 2 === 0 && !playerStats.totalStats.isPB) {
		playerStats.totalStats.isPB = true;
		if (!basePlayerStats.totalStats.tempPB)
			basePlayerStats.totalStats.tempPB = 1;
		const pbPercent = calcPercentRatio(30, card.rank);
		const crit =
      basePlayerStats.totalStats.critical *
      ((basePlayerStats.totalStats.tempPB * pbPercent) / 100);
		basePlayerStats.totalStats.tempPB++;
		playerStats.totalStats.critical = basePlayerStats.totalStats.critical + crit;
		if (!basePlayerStats.totalStats.tempAccPB) basePlayerStats.totalStats.tempAccPB = 1;
		const accPercent = calcPercentRatio(15, card.rank);
		const accuracy =
      basePlayerStats.totalStats.accuracy *
      ((basePlayerStats.totalStats.tempAccPB * accPercent) / 100);
		playerStats.totalStats.accuracy =
      basePlayerStats.totalStats.accuracy + accuracy;
		const desc = `Increasing **CRIT Chances** by __${pbPercent}%__ and ` +
        `its **ACC** is increased by __${accPercent}%__`;
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
	if (round % 2 === 1 && playerStats.totalStats.isPB)
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
}: BattleProcessProps) => {
	if (!card) return;
	// Increase the crit chances of all allies by 20% as well as increasing crit damage of allies by __8%__.
	// need to change prec to be 8%
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
		if (!basePlayerStats.totalStats.criticalTemp)
			basePlayerStats.totalStats.criticalTemp = 1;
		const percent = calcPercentRatio(20, card.rank);
		const crit =
      basePlayerStats.totalStats.critical *
      ((basePlayerStats.totalStats.criticalTemp * percent) / 100);
		basePlayerStats.totalStats.criticalTemp++;
		playerStats.totalStats.critical =
      basePlayerStats.totalStats.critical + crit;
		if (!basePlayerStats.totalStats.critDamageTemp)
			basePlayerStats.totalStats.critDamageTemp = 1;
		const critPercent = calcPercentRatio(8, card.rank);
		const critDamage =
      basePlayerStats.totalStats.criticalDamage *
      ((basePlayerStats.totalStats.critDamageTemp * critPercent) / 100);
		basePlayerStats.totalStats.critDamageTemp++;
		playerStats.totalStats.criticalDamage =
      basePlayerStats.totalStats.criticalDamage + critDamage;
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
		if (!basePlayerStats.totalStats.tempPOM) basePlayerStats.totalStats.tempPOM = 1;
		const accPercent = calcPercentRatio(25, card.rank);
		const acc =
    basePlayerStats.totalStats.accuracy *
    ((basePlayerStats.totalStats.tempPOM * accPercent) / 100);
		basePlayerStats.totalStats.tempPOM++;
		playerStats.totalStats.accuracy = basePlayerStats.totalStats.accuracy + acc;
		const dexPercent = calcPercentRatio(14, card.rank);
		const dex = opponentStats.totalStats.dexterity * (dexPercent / 100);
		opponentStats.totalStats.dexterity = Math.floor(opponentStats.totalStats.dexterity - dex);
		if (!basePlayerStats.totalStats.tempCritPOM) basePlayerStats.totalStats.tempCritPOM = 1;
		const critPercent = calcPercentRatio(20, card.rank);
		const crit =
        basePlayerStats.totalStats.critical *
    ((basePlayerStats.totalStats.tempCritPOM * critPercent) / 100);
		basePlayerStats.totalStats.tempCritPOM++;
		playerStats.totalStats.critical = basePlayerStats.totalStats.critical + crit;
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
		}); 
	}
	if (round % 2 === 1 && playerStats.totalStats.isPOM) playerStats.totalStats.isPOM = false;
	return {
		playerStats,
		opponentStats 
	};
};
