import { BattleProcessProps, BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { probability, randomElementFromArray, round2Decimal } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { addTeamEffectiveness, effectiveness } from "helpers/adventure";
import {
	getPlayerDamageDealt,
	getRelationalDiff,
	processHpBar,
	relativeDiff,
} from "helpers/battle";
import { titleCase } from "title-case";
import { getElementalEffectiveStatus } from "../../battle/battle";

export const elementalStrike = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
}: any) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	// Deal __45%__ magic damage based on your **INT** as well as buffing your **INT** by __25%__
	let damageDiff;
	let damageDealt;
	if (opponentStats.totalStats.abilityToResist?.elementalStrike) {
		const canResist = [ true, false ][
			probability([
				opponentStats.totalStats.abilityToResist.elementalStrike.percent,
				100,
			])
		];
		if (canResist) {
			const desc =
        "But the meteor has **Missed** by a mile, dealing __0__ damage!";
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
			return {
				playerStats,
				opponentStats,
			};
		}
	}
	if (round % 2 === 0) {
		const percent = calcPercentRatio(45, card.rank);
		damageDealt = getRelationalDiff(
			playerStats.totalStats.intelligence,
			percent
		);
		const elementalEffectiveness = addTeamEffectiveness({
			cards: [ { type: card.type } ] as (CollectionCardInfoProps | undefined)[],
			enemyCards: opponentStats.cards,
			playerStats: { effective: 1 } as BattleStats["totalStats"],
			opponentStats: { effective: 1 } as BattleStats["totalStats"],
		});
		const effective = elementalEffectiveness.playerStats.effective;
		damageDealt = Math.floor(damageDealt * effective);
		const abilityDamageCap = Math.floor(
			playerStats.totalStats.originalHp * ((playerStats.isBot ? 1 : 50) / 100)
		);
		if (damageDealt > abilityDamageCap) {
			damageDealt = abilityDamageCap;
		}
		// reduce damage by 50%
		if (
			opponentStats.totalStats.damageReductionPercent &&
      opponentStats.totalStats.damageReductionPercent["elemental strike"]
		) {
			const reductionPercent =
        opponentStats.totalStats.damageReductionPercent["elemental strike"]
        	.percent || 0;
			const reductionRatio = getRelationalDiff(damageDealt, reductionPercent);
			damageDealt = damageDealt - reductionRatio;
		}
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - damageDealt;
		if (opponentStats.totalStats.strength < 0)
			opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		const incPercent = calcPercentRatio(25, card.rank);
		if (!basePlayerStats.totalStats.tempEle) {
			basePlayerStats.totalStats.tempEle = 1;
		}
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence -
      (card.stats.tempEleInc || card.stats.intelligence);

		const intRelDiff = getRelationalDiff(
			card.stats.intelligence,
			basePlayerStats.totalStats.tempEle * incPercent
		);
		basePlayerStats.totalStats.tempEle = basePlayerStats.totalStats.tempEle + 1;
		const eleInc = card.stats.intelligence + intRelDiff;
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence + eleInc;
		card.stats.tempEleInc = eleInc;
		if (damageDiff < 0) damageDiff = 0;

		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;

		const desc = `Deals __${damageDealt}__ **${titleCase(card.type)} ${emojiMap(
			card.type
		)}** damage,${
			effective > 1
				? ` it was ${getElementalEffectiveStatus(
					elementalEffectiveness.opponentStats.effective
				)}`
				: effective < 1
					? " it was not very effective..."
					: ""
		} as well as increasing its **INT** by __${incPercent}%__`;
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

export const spellBook = ({
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
	if (
		!card ||
    !playerStats.totalStats.originalHp ||
    !opponentStats.totalStats.originalHp
	)
		return;
	let desc = "",
		abilityDamage,
		damageDiff,
		playerDamageDiff;
	if (round % 1 === 0 && !playerStats.totalStats.isSB) {
		playerStats.totalStats.isSB = true;
		const temp = randomElementFromArray([ "vitality", "dexterity", "strength" ]);
		// calculate % based on rank
		// Cast a spell on all enemies dealing bonus magic damage or gain __8%__ SPD/HP based on your speed.
		// proc every round [PSV]
		const percent = calcPercentRatio(8, card.rank);
		let ratio = getRelationalDiff(playerStats.totalStats.dexterity, percent);
		if (temp === "strength") {
			const hpDiff =
        playerStats.totalStats.originalHp - playerStats.totalStats.strength;
			ratio = getRelationalDiff(hpDiff, percent);
			playerStats.totalStats.strength = playerStats.totalStats.strength + ratio;
			if (playerStats.totalStats.strength > playerStats.totalStats.originalHp) {
				playerStats.totalStats.strength = playerStats.totalStats.originalHp;
				if (playerStats.totalStats.isBleeding)
					playerStats.totalStats.isBleeding = false;
			}
			desc = `and restores __${ratio}__ missing **HP** ${emoji.heal}`;
		} else if (temp === "dexterity") {
			playerStats.totalStats.dexterity =
        playerStats.totalStats.dexterity + ratio;
			desc = `increasing its **SPD** by __${percent}%__`;
		} else if (temp === "vitality") {
			playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
			const tempDamage = getPlayerDamageDealt(
				playerStats.totalStats,
				opponentStats.totalStats
			);
			abilityDamage = Math.floor(
				Math.abs(tempDamage - playerStats.totalStats.vitality)
			);

			const elements = Object.keys(effectiveness);
			const randomElement = randomElementFromArray(elements);
			const elementalEffectiveness = addTeamEffectiveness({
				cards: [ { type: randomElement } ] as (
          | CollectionCardInfoProps
          | undefined
        )[],
				enemyCards: opponentStats.cards,
				playerStats: { effective: 1 } as BattleStats["totalStats"],
				opponentStats: { effective: 1 } as BattleStats["totalStats"],
			});
			const effective = elementalEffectiveness.playerStats.effective;
			abilityDamage = Math.floor(abilityDamage * effective);
			const abilityDamageCap = Math.floor(
				playerStats.totalStats.originalHp * ((playerStats.isBot ? 1 : 50) / 100)
			);
			if (abilityDamage > abilityDamageCap) {
				abilityDamage = abilityDamageCap;
			}
			opponentStats.totalStats.strength = Math.floor(
				opponentStats.totalStats.strength - abilityDamage
			);
			if (opponentStats.totalStats.strength < 0)
				opponentStats.totalStats.strength = 0;
			playerStats.totalStats.vitality = playerStats.totalStats.vitality - ratio;
			desc = `dealing __${abilityDamage}__ **${titleCase(
				randomElement
			)} ${emojiMap(randomElement)}** damage to **__${opponentStats.name}__**${
				effective > 1
					? ` it was ${getElementalEffectiveStatus(
						elementalEffectiveness.opponentStats.effective
					)}`
					: effective < 1
						? " it was not very effective..."
						: ""
			}`;
		}
		let opponentDamageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		playerDamageDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);
		if (opponentDamageDiff <= 0) {
			opponentDamageDiff = 0;
			damageDiff = 0;
		}
		if (playerDamageDiff <= 0) playerDamageDiff = 0;

		const processedHpBar = processHpBar(
			playerStats.totalStats,
			playerDamageDiff
		);
		playerStats.totalStats.health = processedHpBar.health;
		playerStats.totalStats.strength = processedHpBar.strength;

		const processedOpponentHpBar = processHpBar(
			opponentStats.totalStats,
			opponentDamageDiff
		);
		opponentStats.totalStats.health = processedOpponentHpBar.health;
		opponentStats.totalStats.strength = processedOpponentHpBar.strength;
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
		abilityDamage,
		damageDiff,
		playerDamageDiff,
	};
};

export const tornado = ({
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
	if (
		!card ||
    !opponentStats.totalStats.originalHp ||
    !playerStats.totalStats.originalHp
	)
		return;

	let abilityDamage, damageDiff;
	if (round % 2 === 0 && !playerStats.totalStats.isTornado) {
		playerStats.totalStats.isTornado = true;
		const percent = calcPercentRatio(20, card.rank);
		const playerDamage = getPlayerDamageDealt(
			playerStats.totalStats,
			opponentStats.totalStats
		);
		const ratio = getRelationalDiff(playerDamage, percent);
		abilityDamage = ratio * 3;

		const abilityDamageCap = Math.floor(
			playerStats.totalStats.originalHp * ((playerStats.isBot ? 1 : 50) / 100)
		);
		if (abilityDamage > abilityDamageCap) {
			abilityDamage = abilityDamageCap;
		}
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - abilityDamage;
		if (opponentStats.totalStats.strength < 0)
			opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;

		const desc = `deals __${abilityDamage}__ True Damage`;
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
		abilityDamage,
		damageDiff,
	};
};

export const eclipse = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	basePlayerStats,
	card,
	simulation,
}: any) => {
	if (!card) return;
	playerStats.totalStats.previousRound
		? playerStats.totalStats.previousRound++
		: 0;
	if (round === playerStats.totalStats.previousRound) {
		playerStats.totalStats.isEclipse = false;
	}
	// Harness the power of Eclipse and gain knowledge beyond your enemies
	// increasing your **INT** by __30%__ as well as **Buffing** the **DEF** of all allies by __20%__.
	// gain 80% chance to resist misdirection.
	if (round % 3 === 0 && !playerStats.totalStats.isEclipse) {
		playerStats.totalStats.isEclipse = true;
		playerStats.totalStats.previousRound = round;
		if (!basePlayerStats.totalStats.eclipse)
			basePlayerStats.totalStats.eclipse = 1;
		// inc atk of the card instead of the whole team
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence -
      (card.stats.eclipse || card.stats.intelligence);
		const percent = calcPercentRatio(30, card.rank);
		const relDiff = getRelationalDiff(
			card.stats.intelligence,
			basePlayerStats.totalStats.eclipse * percent
		);
		// const relDiff = getRelationalDiff(basePlayerStats.vitality, (basePlayerStats.rage * 50));
		basePlayerStats.totalStats.eclipse++;
		const inc = card.stats.intelligence + relDiff;
		card.stats.eclipse = inc;
		playerStats.totalStats.intelligence =
      playerStats.totalStats.intelligence + inc;
		if (!basePlayerStats.totalStats.ddef) basePlayerStats.totalStats.ddef = 1;
		const ddPercent = calcPercentRatio(20, card.rank);
		const defDiff = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			basePlayerStats.totalStats.ddef * ddPercent
		);
		basePlayerStats.totalStats.ddef++;
		playerStats.totalStats.defense =
      basePlayerStats.totalStats.defense + defDiff;

		const resistPercent = calcPercentRatio(80, card.rank);
		if (playerStats.totalStats.abilityToResist?.misdirection) {
			playerStats.totalStats.abilitiesToResist.misdirection = {
				percent: round2Decimal(
					(playerStats.totalStats.abilitiesToResist.misdirection.percent || 0) +
            resistPercent
				),
			};
		} else {
			playerStats.totalStats.abilitiesToResist = {
				...playerStats.totalStats.abilitiesToResist,
				misdirection: { percent: resistPercent },
			};
		}
		const desc =
      `harnessing its power increasing **INT** by __${percent}%__ as well as ` +
      `**Buffing DEF** of allies by __${ddPercent}%__`;
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
	};
};
