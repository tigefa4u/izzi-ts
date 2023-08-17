import { BattleProcessProps } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import emoji from "emojis/emoji";
import { calcPercentRatio, statRelationMap } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import {
	getPercentOfTwoNumbers,
	getRelationalDiff,
	processEnergyBar,
	processHpBar,
	relativeDiff,
} from "helpers/battle";

export const surge = ({
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
	if (
		!card ||
    !playerStats.totalStats.originalHp ||
    !opponentStats.totalStats.originalHp
	)
		return;
	// Need to rewird
	// When your hp is below __45%__. Increase life steal of all alies by __75__%
	// deal 100% damage based on hp and bonus damage based on enemy defense
	// as well as inc def by 8% and apply a bleed on the enemy dealing more damage over time.
	let desc,
		abilityDamage = 0,
		damageDiff;
	const perStr = getRelationalDiff(playerStats.totalStats.originalHp, 45);
	if (
		playerStats.totalStats.strength <= perStr &&
    !playerStats.totalStats.isSurge
	) {
		playerStats.totalStats.isSurge = true;
		opponentStats.totalStats.isBleeding = true;
		playerStats.totalStats.bleedResetOnRound = round + 2;
		const percent = calcPercentRatio(65, card.rank);
		playerStats.totalStats.surgePercent = percent;

		const defBuffPercent = calcPercentRatio(8, card.rank);
		const defIncreaseRatio = getRelationalDiff(
			basePlayerStats.totalStats.defense,
			defBuffPercent
		);
		playerStats.totalStats.defense =
      playerStats.totalStats.defense + defIncreaseRatio;
		desc =
      `Increasing **lifesteal** ${emoji.bloodsurge} of all allies by __${percent}%__ as well as ` +
      `buffing its **DEF** by __${defBuffPercent}%__ applying a **Stack** of **BLEED** ${emoji.bleed}`;

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
	} else if (
		playerStats.totalStats.strength > perStr &&
    playerStats.totalStats.isSurge
	) {
		playerStats.totalStats.isSurge = false;
		opponentStats.totalStats.isBleeding = false;
	}
	// if (
	// 	playerStats.totalStats.isSurge &&
	// !opponentStats.totalStats.isBleeding &&
	// (playerStats.totalStats.bleedResetOnRound || 0) + 1 === round
	// ) {
	// 	playerStats.totalStats.bleedResetOnRound = round + 2;
	// 	opponentStats.totalStats.isBleeding = true;
	// }
	if (opponentStats.totalStats.isBleeding) {
		let defenseDiff =
      baseEnemyStats.totalStats.defense - opponentStats.totalStats.defense;
		if (defenseDiff < 0) defenseDiff = 0;
		const percent = calcPercentRatio(100, card.rank);
		const bleedDamage = getRelationalDiff(
			playerStats.totalStats.strength,
			percent
		);
		abilityDamage = bleedDamage + defenseDiff;
		const abilityDamageCap = Math.floor(
			playerStats.totalStats.originalHp * ((playerStats.isBot ? 1 : 50) / 100)
		);
		if (abilityDamage > abilityDamageCap) abilityDamage = abilityDamageCap;
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - abilityDamage;
		if (opponentStats.totalStats.strength < 0)
			opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (damageDiff < 0) damageDiff = 0;
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;
		const desc =
      `**${opponentStats.name}** is affected by **Bleed** ${emoji.bleed} ` +
      `taking __${bleedDamage}__ damage. ${
      	defenseDiff > 0 ? `Also takes additional __${defenseDiff}__ damage` : ""
      }`;
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
	if (
		playerStats.totalStats.bleedResetOnRound &&
    playerStats.totalStats.bleedResetOnRound === round
	) {
		opponentStats.totalStats.isBleeding = false;
		const desc = `${opponentStats.name} has stopped **Bleeding** ${emoji.bleed}`;
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
		abilityDamage,
		damageDiff,
	};
};

export const chronobreak = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	simulation,
	basePlayerStats,
	baseEnemyStats,
}: BattleProcessProps) => {
	// tempora rewind restoring hp and enemy is caught in time dialation taking 20% damage
	// if the stat is lower than basestat, reset it to base stat
	if (
		!card ||
    !playerStats.totalStats.originalHp ||
    !opponentStats.totalStats.originalHp
	)
		return;
	let abilityDamage, opponentDamageDiff;
	if (round % 3 === 0) {
		let restoredHp =
      (playerStats.totalStats.previousHp || 0) -
      playerStats.totalStats.strength;
		if (restoredHp < 0 || isNaN(restoredHp)) restoredHp = 0;
		// need to make abilities based on ranks
		// let restore = Math.round(restoredHp * .8);
		// playerStats.strength = playerStats.strength + restore;
		playerStats.totalStats.strength =
      playerStats.totalStats.strength + restoredHp;
		const damageDiff = relativeDiff(
			playerStats.totalStats.strength,
			playerStats.totalStats.originalHp
		);
		const processedHpBar = processHpBar(playerStats.totalStats, damageDiff);
		playerStats.totalStats.health = processedHpBar.health;
		playerStats.totalStats.strength = processedHpBar.strength;

		const percent = calcPercentRatio(15, card.rank);
		abilityDamage = getRelationalDiff(
			opponentStats.totalStats.vitality,
			percent
		);
		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - abilityDamage;
		if (opponentStats.totalStats.strength <= 0)
			opponentStats.totalStats.strength = 0;
		opponentDamageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (opponentDamageDiff <= 0) opponentDamageDiff = 0;
		const processedOpponentHpBar = processHpBar(
			opponentStats.totalStats,
			opponentDamageDiff
		);
		opponentStats.totalStats.health = processedOpponentHpBar.health;
		opponentStats.totalStats.strength = processedOpponentHpBar.strength;
		let resetStat = "";
		[ "vitality", "dexterity", "defense", "intelligence" ].map((stat, i) => {
			const key = stat as keyof CharacterStatProps;
			if (playerStats.totalStats[key] < basePlayerStats.totalStats[key]) {
				playerStats.totalStats[key] = basePlayerStats.totalStats[key];
				resetStat += `${statRelationMap[key]}${i !== 3 ? ", " : ""}`;
			}
		});
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
		const desc =
      `causing a temporal rewind restoring __${restoredHp}__ **HP**${
      	resetStat ? ` as well as restoring **${resetStat}** stats` : ""
      }. ` +
      `${opponentStats.name} is struck by **Time Dilation** taking __${abilityDamage}__ Damage.`;
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
	if (round % 2 === 0) {
		playerStats.totalStats.previousHp = playerStats.totalStats.strength;
	}
	return {
		playerStats,
		opponentStats,
		abilityDamage,
		damageDiff: opponentDamageDiff,
	};
};
