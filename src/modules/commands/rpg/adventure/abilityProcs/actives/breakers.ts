import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { randomElementFromArray } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { compare, getRelationalDiff } from "helpers/battle";

export const exhaust = ({
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
	if (!playerStats.totalStats.exhNum) {
		playerStats.totalStats.exhNum = 2;
	}
	// Permanently decrease the __SPD/INT__ of all enemies by __20%__
	if (
		round % playerStats.totalStats.exhNum === 0 &&
    !playerStats.totalStats.isExhaust
	) {
		playerStats.totalStats.isExhaust = true;
		const tempInt = compare(
			playerStats.totalStats.intelligence,
			opponentStats.totalStats.intelligence
		);
		const num = tempInt ? 2 : 3;
		playerStats.totalStats.exhNum = playerStats.totalStats.exhNum + num;
		const temp = randomElementFromArray([ "dexterity", "intelligence" ]);
		const percent = calcPercentRatio(20, card.rank);
		const relDiff = getRelationalDiff(
			opponentStats.totalStats[temp as keyof CharacterStatProps],
			percent
		);
		opponentStats.totalStats[temp as keyof CharacterStatProps] =
      opponentStats.totalStats[temp as keyof CharacterStatProps] - relDiff;
		const desc = `Decreasing ${opponentStats.name}'s **${
			temp === "dexterity"
				? "SPD"
				: temp === "intelligence"
					? "INT"
					: temp.toUpperCase()
		}** by __${percent}%__`;

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
	if (round % 3 === 2 && playerStats.totalStats.isExhaust)
		playerStats.totalStats.isExhaust = false;
	return {
		playerStats,
		opponentStats,
	};
};

export const rapidFire = ({
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
	// After a short delay decrease the enemies defense by __20%__. Their defense increases by __10%__ every turn.
	if (round % 3 === 0 && !playerStats.totalStats.isRapid) {
		playerStats.totalStats.isUsePassive = true;
		playerStats.totalStats.isRapid = true;
		// calculate % based on rank
		const percent = calcPercentRatio(20, card.rank);
		const defPer = getRelationalDiff(opponentStats.totalStats.defense, percent);
		opponentStats.totalStats.defense =
      opponentStats.totalStats.defense - defPer;
		const desc = `Decreasing the **DEF** of all enemies by __${percent}%__`;
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
	if (round % 3 === 2 && playerStats.totalStats.isRapid)
		playerStats.totalStats.isRapid = false;
	if (playerStats.totalStats.isUsePassive) {
		// let inc = calcPercentRatio(6, card.rank);
		let inc = 10;
		if (
			[ "legend", "divine", "immortal", "exclusive", "ultimate" ].includes(
				card.rank
			)
		) {
			inc = 14;
		}
		const temp = getRelationalDiff(opponentStats.totalStats.defense, inc);
		opponentStats.totalStats.defense = opponentStats.totalStats.defense + temp;
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const dominator = ({
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
	if (!playerStats.totalStats.domNum) playerStats.totalStats.domNum = 2;
	// Parmanently decrease the **AFK** of all enemies by __14%__ as well as decreasing their **INT** by __3%__
	if (
		round % playerStats.totalStats.domNum === 0 &&
    !playerStats.totalStats.isDominator
	) {
		playerStats.totalStats.isDominator = true;
		const hasMoreInt = compare(
			playerStats.totalStats.intelligence,
			opponentStats.totalStats.intelligence
		);
		const num = hasMoreInt ? 2 : 3;
		playerStats.totalStats.domNum = playerStats.totalStats.domNum + num;
		const percent = calcPercentRatio(14, card.rank);
		const ratio = getRelationalDiff(opponentStats.totalStats.vitality, percent);
		opponentStats.totalStats.vitality =
      opponentStats.totalStats.vitality - ratio;
		const decPercent = calcPercentRatio(3, card.rank);
		const decRatio = getRelationalDiff(
			opponentStats.totalStats.intelligence,
			decPercent
		);
		opponentStats.totalStats.intelligence =
      opponentStats.totalStats.intelligence - decRatio;
		const desc =
      `crippling **__${opponentStats.name}__** decreasing ` +
      `it's **ATK** by __${percent}%__ as well as decreasing its **INT** by __${decPercent}%__`;
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
	if (round % 3 === 2 && playerStats.totalStats.isDominator) {
		playerStats.totalStats.isDominator = false;
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const crusher = ({
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
	// Decrease the **ATTACK** of enemies by __20%__. Their ATK increases by __10%__ each turn
	if (round % 2 === 0 && !playerStats.totalStats.isUseCrusher) {
		playerStats.totalStats.isUseCrusher = true;
		// calculate ratio based on rank
		const percent = calcPercentRatio(20, card.rank);
		const ratio = getRelationalDiff(opponentStats.totalStats.vitality, percent);
		opponentStats.totalStats.vitality =
      opponentStats.totalStats.vitality - ratio;
		const desc = `Decreasing **__${opponentStats.name}'s__** **ATK** by __${percent}%__`;
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
	if (round % 4 === 0 && playerStats.totalStats.isUseCrusher)
		playerStats.totalStats.isUseCrusher = false;
	if (playerStats.totalStats.isUseCrusher) {
		// let inc = calcPercentRatio(6, card.rank);
		let inc = 10;
		if (
			[ "legend", "divine", "immortal", "exclusive", "ultimate" ].includes(
				card.rank
			)
		) {
			inc = 14;
		}
		const rel = getRelationalDiff(opponentStats.totalStats.vitality, inc);
		opponentStats.totalStats.vitality = opponentStats.totalStats.vitality + rel;
	}
	return {
		playerStats,
		opponentStats,
	};
};
