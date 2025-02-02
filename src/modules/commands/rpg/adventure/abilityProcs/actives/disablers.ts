import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { probability } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { calculateSkillProcRound, prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	getPercentOfTwoNumbers,
	getRelationalDiff,
	processEnergyBar,
	processHpBar,
	relativeDiff,
} from "helpers/battle";
import { titleCase } from "title-case";

export const electrocute = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	if (opponentStats.totalStats.abilityToResist?.electrocute) {
		const canResist = [ true, false ][
			probability([
				opponentStats.totalStats.abilityToResist.electrocute.percent,
				100,
			])
		];

		if (canResist) {
			const desc = `but **${opponentStats.name}** was influenced by **Future Sight** taking **No damage.**`;
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
			return {
				playerStats,
				opponentStats,
			};
		}
	}
	let damageDiff;
	const procStun = [ true, false ];
	let perDamage;
	playerStats.totalStats.previousRound
		? playerStats.totalStats.previousRound++
		: null;
	if (
		playerStats.totalStats.previousRound &&
    round >= playerStats.totalStats.previousRound
	) {
		if (opponentStats.totalStats.isStunned) {
			opponentStats.totalStats.isStunned = false;
		}
	}
	// Deal __20%__ electric damage based on **INT** also gain a chance of inflicting paralysis
	const procRound = calculateSkillProcRound(3, card.reduceSkillCooldownBy);
	if (round % procRound === 0) {
		playerStats.totalStats.previousRound = round;
		opponentStats.totalStats.isStunned = procStun[probability([ 55, 45 ])];
		const percent = calcPercentRatio(50, card.rank);
		perDamage = getRelationalDiff(playerStats.totalStats.vitality, percent);
		if (isNaN(perDamage)) perDamage = 0;
		// reduce damage by 50%
		if (opponentStats.totalStats.damageReductionPercent?.electrocute) {
			const reductionPercent =
        opponentStats.totalStats.damageReductionPercent.electrocute.percent ||
        0;
			const reductionRatio = getRelationalDiff(perDamage, reductionPercent);
			perDamage = perDamage - reductionRatio;
		}

		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - perDamage;
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

		// electrocute is causing NAN
		// dealing __${perDamage}__ damage
		const desc =
      `Electrocuting **__${opponentStats.name}__** dealing __${perDamage}__ ` +
      `**Electric** damage, as well as Inflicting a stack of **Paralysis**, ${
      	opponentStats.totalStats.isStunned
      		? `${opponentStats.name} is affected by Paralysis!`
      		: "but it resisted!"
      }`;
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
		damageDiff,
		abilityDamage: perDamage,
	};
};

export const sleep = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card) return;
	let desc,
		isResist = false;
	if (opponentStats.totalStats.isAsleep) {
		const temp = [ true, false ];
		const wakeupProb = [ 55, 45 ];
		if (temp[probability(wakeupProb)]) {
			opponentStats.totalStats.isAsleep = false;
			desc = `**__${opponentStats.name}__** has snapped out of ${emoji.sleep} **Sleep!**`;
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
				simulation,
				baseEnemyStats,
				basePlayerStats,
			});
		}
	}
	if (opponentStats.totalStats.sleepResistPercent) {
		const resistProb = probability([
			opponentStats.totalStats.sleepResistPercent,
			100,
		]);
		isResist = [ true, false ][resistProb];
	}
	const procRound = calculateSkillProcRound(3, card.reduceSkillCooldownBy);
	if (round % procRound === 0 && !opponentStats.totalStats.isAsleep) {
		opponentStats.totalStats.isAsleep = !isResist;
		// put your enemies to sleep causing them to miss their turns until they are awake.
		desc = `**__${opponentStats.name}__** felt **Drowsy** ${
			isResist ? "but it resisted!" : "and fell **Asleep**"
		}`;
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

export const misdirection = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	if (opponentStats.totalStats.abilityToResist?.misdirection) {
		const canResist = [ true, false ][
			probability([
				opponentStats.totalStats.abilityToResist.misdirection.percent,
				100,
			])
		];

		if (canResist) {
			const desc = "but it **Failed.**";
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
			return {
				playerStats,
				opponentStats,
			};
		}
	}
	let abilityDamage, damageDiff;
	// inflict a stack of confusion on your enemies and gain a chance to cause them to inflict damage
	// upon itself based on their attack as well as increasing **INT** of all allies by __20%__.
	const procRound = calculateSkillProcRound(2, card.reduceSkillCooldownBy);
	if (round % procRound === 0) {
		const isConfused = [ true, false ];
		let desc;
		const tempPercent = calcPercentRatio(20, card.rank);
		const ratio = getRelationalDiff(
			basePlayerStats.totalStats.intelligence,
			tempPercent
		);
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence + ratio;

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
		if (isConfused[probability([ 60, 40 ])]) {
			const percent = calcPercentRatio(25, card.rank);
			abilityDamage = getRelationalDiff(
				opponentStats.totalStats.vitality,
				percent
			);
			opponentStats.totalStats.strength =
        opponentStats.totalStats.strength - abilityDamage;
			if (opponentStats.totalStats.strength <= 0)
				opponentStats.totalStats.strength = 0;
			damageDiff = relativeDiff(
				opponentStats.totalStats.strength,
				opponentStats.totalStats.originalHp
			);
			if (damageDiff <= 0) damageDiff = 0;
			const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
			opponentStats.totalStats.health = processedHpBar.health;
			opponentStats.totalStats.strength = processedHpBar.strength;

			desc =
        `**__${opponentStats.name}__** is **Confused** ${emoji.confusion} and ` +
        `takes __${abilityDamage}__ damage.`;
		} else {
			desc =
        `Increasing **ARMOR** of all allies by __${tempPercent}__ as well as ` +
        `inflicting a stack of **Confusion** on **__${opponentStats.name}__**, but it resisted!`;
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
			baseEnemyStats,
			basePlayerStats,
		});
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage,
	};
};

export const restriction = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card) return;
	let desc,
		isResist = false;
	if (opponentStats.totalStats.restrictResistPercent) {
		const resistProb = probability([
			opponentStats.totalStats.restrictResistPercent,
			100 - opponentStats.totalStats.restrictResistPercent,
		]);
		isResist = [ true, false ][resistProb];
	}
	const procRound = calculateSkillProcRound(2, card.reduceSkillCooldownBy);
	if (round % procRound === 0 && !opponentStats.totalStats.isRestrictResisted) {
		let rapidFireReset = false;
		if (!isResist) {
			const cardHasRapidFire = opponentStats.cards.find(
				(c) => c?.abilityname === "rapid fire"
			);
			if (cardHasRapidFire) {
				rapidFireReset = true;
				const percent = calcPercentRatio(35, cardHasRapidFire.rank);
				opponentStats.totalStats.damageBuildUpPercent = {
					...opponentStats.totalStats.damageBuildUpPercent,
					"rapid fire": {
						percent: percent,
						basePercent: percent,
					},
				};
			}
		}
		// last for 2 turns
		playerStats.totalStats.restrictionResetOnRound = round + 2;

		// restrict all enemies from using their passive for the next 2 turns.
		opponentStats.totalStats.isRestrictResisted = !isResist;
		desc =
      `restricting **__${opponentStats.name}__** from using its ` +
      `**Abilities**${
      	isResist
      		? ", But it resisted!"
      		: `${
      			rapidFireReset
      				? " as well as resetting **Rapid Fire** bonus damage %"
      				: ""
      		}`
      }.`;
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
		playerStats.totalStats.restrictionResetOnRound &&
    round >= playerStats.totalStats.restrictionResetOnRound &&
    opponentStats.totalStats.isRestrictResisted
	) {
		opponentStats.totalStats.isRestrictResisted = false;
		desc = `**__${opponentStats.name}__** has been released from ${titleCase(
			card.name
		)}'s **Restriction!**`;
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
