import { BattleProcessProps, BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { emojiMap } from "emojis";
import { calcPercentRatio } from "helpers/ability";
import { calculateSkillProcRound, prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { addTeamEffectiveness } from "helpers/adventure";
import {
	compare,
	getRelationalDiff,
	processHpBar,
	relativeDiff,
} from "helpers/battle";
import { titleCase } from "title-case";
import { getElementalEffectiveStatus } from "../../battle/battle";

export const balancingStrike = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation,
	baseEnemyStats,
	basePlayerStats
}: BattleProcessProps) => {
	if (
		!card ||
    !playerStats.totalStats.originalHp ||
    !opponentStats.totalStats.originalHp
	)
		return;

	// Balancing Strike (every 2 rounds) - User will unleash 
	// a strike of adaptive elemental damage which will deal 30% 
	// of all allies ATK. if the enemy has dealt more damage than 
	// their previous damage from normal attacks or ability damage, 
	// the next Balancing Strike damage will deal 1.5x more damage. 
	// Each balancing strike will
	// inflict 1/4th of the damage dealt to the user 
	// and reduce def by 5%

	let damageDiff;
	let abilityDamage;
	let playerDamageDiff;
	const procRound = calculateSkillProcRound(2, card.reduceSkillCooldownBy);
	if (round % procRound === 0 && !playerStats.totalStats.isBstrike) {
		playerStats.totalStats.isBstrike = true;

		const e_defPercent = calcPercentRatio(5, card.rank);
		const e_defRatio = getRelationalDiff(
			baseEnemyStats.totalStats.defense,
			e_defPercent
		);
		opponentStats.totalStats.defense = opponentStats.totalStats.defense - e_defRatio;

		const num = 30;
		const percent = calcPercentRatio(num, card.rank);
		let damageDealt = getRelationalDiff(
			playerStats.totalStats.vitality,
			percent
		);
		const enemyPrevDamage = opponentStats.totalStats.previousDamage || 0;
		const playerPrevDamage = playerStats.totalStats.previousDamage || 0;
		if (enemyPrevDamage > playerPrevDamage) {
			damageDealt = damageDealt * 1.5;
		}

		const elementalEffectiveness = addTeamEffectiveness({
			cards: [ { type: card.type } ] as (CollectionCardInfoProps | undefined)[],
			enemyCards: opponentStats.cards,
			playerStats: { effective: 1 } as BattleStats["totalStats"],
			opponentStats: { effective: 1 } as BattleStats["totalStats"],
		});
		const effective = elementalEffectiveness.playerStats.effective;
		damageDealt = Math.floor(damageDealt * effective);

		// damage reduction by 50%
		if (
			opponentStats.totalStats.damageReductionPercent &&
      opponentStats.totalStats.damageReductionPercent["balancing strike"]
		) {
			const diff = getRelationalDiff(
				damageDealt,
				opponentStats.totalStats.damageReductionPercent["balancing strike"]
					.percent || 0
			);
			damageDealt = damageDealt - diff;
		}

		abilityDamage = damageDealt;
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - damageDealt;
		if (opponentStats.totalStats.strength <= 0)
			opponentStats.totalStats.strength = 0;
		const reflect = Math.round(damageDealt * (1 / 4));
		playerStats.totalStats.strength = playerStats.totalStats.strength - reflect;
		if (playerStats.totalStats.strength <= 0)
			playerStats.totalStats.strength = 0;
		playerDamageDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);
		let opponentDamageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (opponentDamageDiff <= 0) opponentDamageDiff = 0;
		if (playerDamageDiff <= 0) playerDamageDiff = 0;

		const processedPlayerHpBar = processHpBar(
			playerStats.totalStats,
			playerDamageDiff
		);
		playerStats.totalStats.health = processedPlayerHpBar.health;
		playerStats.totalStats.strength = processedPlayerHpBar.strength;

		const processedOpponentHpBar = processHpBar(
			opponentStats.totalStats,
			opponentDamageDiff
		);
		opponentStats.totalStats.health = processedOpponentHpBar.health;
		opponentStats.totalStats.strength = processedOpponentHpBar.strength;

		if (opponentDamageDiff <= 0) damageDiff = 0;
		const desc =
      `Dealing __${damageDealt}__ **${titleCase(card.type)} ${emojiMap(
      	card.type
      )}** damage to ` +
      `**__${opponentStats.name}__** decreasing its **DEF** by __${e_defPercent}%__${
      	effective > 1
      		? ` it was ${getElementalEffectiveStatus(
      			elementalEffectiveness.opponentStats.effective
      		)}`
      		: effective < 1
      			? " it was not very effective..."
      			: ""
      } and also takes __${reflect}__ ` +
      "damage on itself.";

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
			basePlayerStats
		});
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage,
		playerDamageDiff,
	};
};
