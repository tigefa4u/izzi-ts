import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { probability, randomElementFromArray } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	compare,
	getPlayerDamageDealt,
	getRelationalDiff,
	processHpBar,
	relativeDiff,
} from "helpers/battle";
import { clone } from "utility";

export const exhaust = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
}: BattleProcessProps) => {
	if (!card) return;
	if (!playerStats.totalStats.exhNum) {
		playerStats.totalStats.exhNum = 2;
	}
	// At start of battle if enemy SPD is more, swap spd
	if (
		round === 1 &&
    opponentStats.totalStats.dexterity > playerStats.totalStats.dexterity
	) {
		const swp = clone(opponentStats.totalStats.dexterity);
		opponentStats.totalStats.dexterity = playerStats.totalStats.dexterity;
		playerStats.totalStats.dexterity = swp;

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: `**[PSV]** swapping all ally **SPD** with ${opponentStats.name}`,
			totalDamage: 0,
			isPlayerFirst,
			isItem: false,
			simulation,
		});
	}
	// Permanently decrease the __SPD/INT__ of all enemies by __25%__
	// as well as buffing all allies for the same stat
	if (
		round % playerStats.totalStats.exhNum === 0 &&
    !playerStats.totalStats.isExhaust
	) {
		playerStats.totalStats.isExhaust = true;
		// const tempInt = compare(
		// 	playerStats.totalStats.intelligence,
		// 	opponentStats.totalStats.intelligence
		// );
		const num = 2;
		playerStats.totalStats.exhNum = playerStats.totalStats.exhNum + num;
		const temp = randomElementFromArray([ "dexterity", "intelligence" ]);
		const percent = calcPercentRatio(25, card.rank);
		const relDiff = getRelationalDiff(
			opponentStats.totalStats[temp as keyof CharacterStatProps],
			percent
		);
		const buffDiff = getRelationalDiff(
			playerStats.totalStats[temp as keyof CharacterStatProps],
			percent
		);
		playerStats.totalStats[temp as keyof CharacterStatProps] =
      playerStats.totalStats[temp as keyof CharacterStatProps] + buffDiff;

		opponentStats.totalStats[temp as keyof CharacterStatProps] =
      opponentStats.totalStats[temp as keyof CharacterStatProps] - relDiff;

		const statDesc = temp === "dexterity" ? "SPD" : "INT";

		const desc =
      `Decreasing ${opponentStats.name}'s **${statDesc}** by __${percent}%__ ` +
      `as well as increasing **${statDesc}** of all allies by __${percent}%__`;

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
	simulation,
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	// decrease the enemies defense by __10%__.
	// deal 50% bonus true damage based on INT
	// Buff damage dealt % by 5% every round

	let damageDealt, damageDiff;
	if (round >= 3 && round % 1 === 0 && !playerStats.totalStats.isRapid) {
		playerStats.totalStats.isRapid = true;
		const damagePercent = calcPercentRatio(30, card.rank);

		const _buildUpPercent = (playerStats.totalStats.damageBuildUpPercent || {})[
			"rapid fire"
		];
		playerStats.totalStats.damageBuildUpPercent = {
			...playerStats.totalStats.damageBuildUpPercent,
			"rapid fire": {
				basePercent: damagePercent,
				percent: _buildUpPercent?.percent
					? _buildUpPercent.percent + 5
					: damagePercent,
			},
		};
		let desc = "Increasing its **Bonus Damage** by __5%__";

		const canDealDamage = [ true, false ][probability([ 50, 50 ])];

		if (canDealDamage) {
			damageDealt = getPlayerDamageDealt(
				playerStats.totalStats,
				opponentStats.totalStats
			);

			const buildUpPercent =
        (playerStats.totalStats.damageBuildUpPercent || {})["rapid fire"]
        	?.percent || damagePercent;
			damageDealt = getRelationalDiff(damageDealt, buildUpPercent);

			desc = desc + `, dealing __${damageDealt}__.`;

			opponentStats.totalStats.strength =
        opponentStats.totalStats.strength - damageDealt;
			if (
				opponentStats.totalStats.strength < 0 ||
        isNaN(opponentStats.totalStats.strength)
			)
				opponentStats.totalStats.strength = 0;
			damageDiff = relativeDiff(
				opponentStats.totalStats.strength,
				opponentStats.totalStats.originalHp
			);
			if (damageDiff < 0) damageDiff = 0;
			const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
			opponentStats.totalStats.strength = processedHpBar.strength;
			opponentStats.totalStats.health = processedHpBar.health;
		}
		if (round % 3 === 0) {
			const percent = calcPercentRatio(10, card.rank);
			const defPer = getRelationalDiff(opponentStats.totalStats.defense, percent);
			opponentStats.totalStats.defense =
		  opponentStats.totalStats.defense - defPer;
		  if (canDealDamage) {
				desc = desc + " Decreasing";
		  } else {
				desc = desc + " as well as decreasing";
		  }
		  desc = desc + `the **DEF** of all enemies by __${percent}%__`;
		}
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
		});
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage: damageDealt,
	};
};

export const dominator = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	baseEnemyStats,
	card,
	simulation,
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

		if (opponentStats.totalStats.intelligence < 0) {
			opponentStats.totalStats.intelligence =
        baseEnemyStats.totalStats.intelligence;
		}

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
			simulation,
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
	simulation,
}: BattleProcessProps) => {
	if (!card) return;
	// Decrease the **ATTACK** of enemies by __25%__. Their ATK increases by __10%__ each turn
	if (round % 2 === 0 && !playerStats.totalStats.isUseCrusher) {
		playerStats.totalStats.isUseCrusher = true;
		// calculate ratio based on rank
		const percent = calcPercentRatio(25, card.rank);
		const ratio = getRelationalDiff(opponentStats.totalStats.vitality, percent);
		const defDecratio = getRelationalDiff(
			opponentStats.totalStats.defense,
			percent
		);
		opponentStats.totalStats.vitality =
      opponentStats.totalStats.vitality - ratio;
		opponentStats.totalStats.defense =
      opponentStats.totalStats.defense - defDecratio;

		let inc = 5;
		if (
			[ "legend", "divine", "immortal", "exclusive", "ultimate" ].includes(
				card.rank
			)
		) {
			inc = 6;
		}
		const desc =
      `Decreasing **__${opponentStats.name}'s__** **ATK** and **DEF** by __${percent}%__. ` +
      `**__${opponentStats.name}'s__** **ATK** will increase by __${inc}%__ each round.`;
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
		});
	}
	if (round % 4 === 0 && playerStats.totalStats.isUseCrusher)
		playerStats.totalStats.isUseCrusher = false;
	if (playerStats.totalStats.isUseCrusher) {
		// let inc = calcPercentRatio(6, card.rank);
		let inc = 5;
		if (
			[ "legend", "divine", "immortal", "exclusive", "ultimate" ].includes(
				card.rank
			)
		) {
			inc = 6;
		}
		const rel = getRelationalDiff(opponentStats.totalStats.vitality, inc);
		opponentStats.totalStats.vitality = opponentStats.totalStats.vitality + rel;
	}
	return {
		playerStats,
		opponentStats,
	};
};
