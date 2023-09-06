import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { randomElementFromArray } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	getPercentOfTwoNumbers,
	getRelationalDiff,
	processEnergyBar,
} from "helpers/battle";

export * from "./stacks";
export * from "./heals";
export * from "./evasion";
export * from "./elementals";
export * from "./disablers";
export * from "./critical";
export * from "./breakers";
export * from "../special";
export * from "./defensiveOffense";
export * from "./intelligence";

export const dragonRage = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: any) => {
	if (!card) return;
	// "While your health is below 35% lower your **INT** by __10%__ and increase your **ATK** by __35__% (OLD)
	// Increase **ATK** of all allies by __25%__ as well as decreasing their **DEF** by __6%__
	// const hpRatio = Math.floor((playerStats.originalHp * 35) / 100);
	if (round % 2 === 0 && !playerStats.totalStats.isRage) {
		playerStats.totalStats.isRage = true;
		let desc = "";
		const operations: any = {
			"+": (x: any, y: any) => x + y,
			"-": (x: any, y: any) => x - y,
		};

		[
			{
				name: "vitality",
				num: 30,
				op: "+",
				desc: `Increasing the **ATK** of all allies by __${calcPercentRatio(
					30,
					card.rank
				)}%__`,
			},
			{
				name: "defense",
				num: 7,
				op: "-",
				desc: ` as well as decreasing their **DEF** by __${calcPercentRatio(
					7,
					card.rank
				)}%__`,
			},
		].map((temp) => {
			const percent = calcPercentRatio(temp.num, card.rank);
			const relDiff = getRelationalDiff(
				basePlayerStats.totalStats[temp.name],
				percent
			);
			playerStats.totalStats[temp.name] = operations[temp.op](
				playerStats.totalStats[temp.name],
				relDiff
			);
			desc = desc ? desc + temp.desc : temp.desc;
		});
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

export const predator = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: any) => {
	if (!card) return;
	// Increase the **ATK/DEF** by __10%__ as well as increasing its **SPD** by __15%__
	// proc every round upto r10
	if (round <= 10 && !playerStats.totalStats.isPred) {
		playerStats.totalStats.isPred = true;
		const temp = randomElementFromArray([ "vitality", "defense" ]);
		const percent = calcPercentRatio(10, card.rank);
		const relDiff = getRelationalDiff(
			basePlayerStats.totalStats[temp],
			percent
		);
		playerStats.totalStats[temp] = playerStats.totalStats[temp] + relDiff;

		const dexPercent = calcPercentRatio(15, card.rank);
		const dexPer = getRelationalDiff(
			basePlayerStats.totalStats.dexterity,
			dexPercent
		);

		playerStats.totalStats.dexterity =
      playerStats.totalStats.dexterity + dexPer;
		const desc = `Increasing **${
			temp === "vitality" ? "ATK" : temp.toUpperCase()
		}** by __${percent}%__, and has also gained __${dexPercent}%__ **SPD**`;
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

export const bonePlating = ({
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
	/**
   * At the start of the round take 40% less damage,
   * damage taken increases every 3rd round proc
   * by 8%
   */
	if (round === 1 && !playerStats.totalStats.isPlatting) {
		playerStats.totalStats.isEndure = true;
		playerStats.totalStats.isPlatting = true;
		playerStats.totalStats.previousRound = round;
		const percent = calcPercentRatio(40, card.rank);
		const { percent: bonePlatePercent } = (playerStats.totalStats
			.trueDamageReductionPercent || {})["bone plating"] || { percent: 0 };
		playerStats.totalStats.trueDamageReductionPercent = {
			...playerStats.totalStats.trueDamageReductionPercent,
			"bone plating": { percent: percent + bonePlatePercent },
		};
		// 	const relDiff = getRelationalDiff(
		// 		baseEnemyStats.totalStats.vitality,
		// 		percent
		// 	);
		// 	opponentStats.totalStats.vitality =
		//   opponentStats.totalStats.vitality - relDiff;
		const desc =
      `Buffing all allies with **Endurance**, taking __${percent}%__ less damage. ` +
      "Ally **Endurance** will reduce by __8%__ every 3rd round.";
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
	if (
		round % 3 === 0 &&
    playerStats.totalStats.isPlatting &&
    playerStats.totalStats.trueDamageReductionPercent &&
    playerStats.totalStats.trueDamageReductionPercent["bone plating"]
	) {
		playerStats.totalStats.trueDamageReductionPercent["bone plating"].percent =
      playerStats.totalStats.trueDamageReductionPercent["bone plating"]
      	.percent - 8;
		// 	const temp = getRelationalDiff(opponentStats.totalStats.vitality, 15);
		// 	opponentStats.totalStats.vitality =
		//   opponentStats.totalStats.vitality + temp;
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const killerInstincts = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card) return;
	// need to change
	// Cast an aura of killer instincts increasing **INT** your by __30%__ as well as
	// increasing your **SPD** by __30%__, also gain __5%__ evasion chances.

	// rework - buff dpr by 22%
	if (round % 3 === 0 && !playerStats.totalStats.isKiller) {
		playerStats.totalStats.isKiller = true;
		const incPercent = calcPercentRatio(30, card.rank);
		const ratio = basePlayerStats.totalStats.dexterity * (incPercent / 100);
		playerStats.totalStats.dexterity = playerStats.totalStats.dexterity + ratio;

		const intRatio =
      basePlayerStats.totalStats.intelligence * (incPercent / 100);
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence + intRatio;
	  const diff = getPercentOfTwoNumbers(playerStats.totalStats.intelligence, basePlayerStats.totalStats.intelligence);
	  const playerEnergy = processEnergyBar({
			dpr: diff,
			energy: playerStats.totalStats.energy
	  });
	  playerStats.totalStats.energy = playerEnergy.energy;
	  playerStats.totalStats.dpr = playerEnergy.dpr;
		// const dprPercent = calcPercentRatio(15, card.rank);
		// const dprRatio = (dprPercent / 100);
		// playerStats.totalStats.dpr = playerStats.totalStats.dpr + dprRatio;
		// const playerEnergy = processEnergyBar({
		// 	dpr: playerStats.totalStats.dpr,
		// 	energy: playerStats.totalStats.energy
		// });
		// playerStats.totalStats.dpr = playerEnergy.dpr;
		// playerStats.totalStats.energy = playerEnergy.energy;

		const evaPercent = calcPercentRatio(5, card.rank);
		const evaRatio = basePlayerStats.totalStats.evasion * (evaPercent / 100);
		playerStats.totalStats.evasion = playerStats.totalStats.evasion + evaRatio;

		const desc =
      `increasing **ARMOR** as well as **SPD** by __${incPercent}%__, ` +
      `And has also increased its evasion chances by __${evaPercent}%__`;
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

const abilitiesToResist = [
	{
		name: "Elemental Strike",
		emoji: emoji.elementalstrike,
		key: "elementalStrike",
	},
	{
		name: "Electrocute",
		emoji: emoji.electrocute,
		key: "electrocute",
	},
	{
		name: "Tornado",
		emoji: emoji.tornado,
		key: "tornado",
	},
];
export const futureSight = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card) return;
	/**
   * Passive - at start of round proc
   * 50% ability damage reduction
   */

	if (round === 1) {
		playerStats.totalStats.damageReductionPercent = {
			...playerStats.totalStats.damageReductionPercent,
			"elemental strike": { percent: 30 },
			electrocute: { percent: 30 },
			"balancing strike": { percent: 30 },
		};

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description:
        "**[PSV]** gaining __30%__ **Damage Reduction** on " +
        "**Elemental Strike, Balancing Strike, Electrocute**",
			totalDamage: 0,
			isPlayerFirst,
			isItem: false,
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});
	}

	// Transcend beyond time getting a glimpse of the future increasing **INT** of all allies by __30%__
	// as well as increasing **EVA** by __15%__.
	if (round % 3 === 0 && !playerStats.totalStats.isFuture) {
		playerStats.totalStats.isFuture = true;
		const percent = calcPercentRatio(30, card.rank);
		const relDiff = getRelationalDiff(
			basePlayerStats.totalStats.intelligence,
			percent
		);
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence + relDiff;
		const diff = getPercentOfTwoNumbers(
			playerStats.totalStats.intelligence,
			basePlayerStats.totalStats.intelligence
		);
		const playerEnergy = processEnergyBar({
			dpr: diff,
			energy: playerStats.totalStats.energy,
		});
		playerStats.totalStats.energy = playerEnergy.energy;
		playerStats.totalStats.dpr = playerEnergy.dpr;

		const evaPercent = calcPercentRatio(15, card.rank);
		const evaRatio = basePlayerStats.totalStats.evasion * (evaPercent / 100);
		playerStats.totalStats.evasion = playerStats.totalStats.evasion + evaRatio;
		const desc =
      `increasing **ARMOR** of all allies by __${percent}%__ as well as increasing ` +
      `**Evasion Chances** by __${evaPercent}%__`;
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
