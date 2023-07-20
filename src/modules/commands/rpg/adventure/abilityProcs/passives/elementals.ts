import { BattleProcessProps, BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { emojiMap } from "emojis";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
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

	// dark type damage
	// Deal elemental damage equal to __25%__ of your ATK as true damage, and take 1/3 of
	// the damage dealt to yourself. If your spd is more than you deal __25%__ more damage.
	let damageDiff;
	let abilityDamage;
	let playerDamageDiff;
	if (round % 2 === 0 && !playerStats.totalStats.isBstrike) {
		playerStats.totalStats.isBstrike = true;
		let num = 25;
		const hasMoreSpeed = compare(
			playerStats.totalStats.dexterity,
			opponentStats.totalStats.dexterity
		);
		if (hasMoreSpeed) {
			num = 50;
		}
		const percent = calcPercentRatio(num, card.rank);
		let damageDealt = getRelationalDiff(
			playerStats.totalStats.vitality,
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
		const reflect = Math.round(damageDealt * (1 / 3));
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
      `**__${opponentStats.name}__**${
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
