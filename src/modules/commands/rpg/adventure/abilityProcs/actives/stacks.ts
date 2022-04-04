import { BattleProcessProps } from "@customTypes/adventure";
import emoji from "emojis/emoji";
import { probability, randomNumber } from "helpers";
import { calcPercentRatio } from "helpers/ability";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getPlayerDamageDealt, getRelationalDiff, processHpBar, relativeDiff } from "helpers/battle";

export const toxicScreen = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	// Inflict a stack of poison on all enemies decreasing their defense by __20__%
	// as well as reducing all lifesteal affects by __8%__
	let desc;
	let damageDiff;
	let abilityDamage;
	if (round % 3 === 0 && !playerStats.totalStats.isToxic) {
		playerStats.totalStats.isToxic = true;
		opponentStats.totalStats.isPoisoned = true;
		const percent = calcPercentRatio(20, card.rank);
		const relDiff = getRelationalDiff(
			opponentStats.totalStats.defense,
			percent
		);
		opponentStats.totalStats.defense =
      opponentStats.totalStats.defense - relDiff;
		const lifestealPercent = calcPercentRatio(8, card.rank);
		if (opponentStats.totalStats.isLifesteal) {
			const tempDiff = getRelationalDiff(
				opponentStats.totalStats.lifestealPercent || 0,
				lifestealPercent
			);
			opponentStats.totalStats.lifestealPercent =
        (opponentStats.totalStats.lifestealPercent || 0) - tempDiff;
			if (opponentStats.totalStats.lifestealPercent < 0)
				opponentStats.totalStats.lifestealPercent = 0;
		}
		if (opponentStats.totalStats.isSurge) {
			const tempDiff = getRelationalDiff(
				opponentStats.totalStats.surgePercent || 0,
				lifestealPercent
			);
			opponentStats.totalStats.surgePercent =
        (opponentStats.totalStats.surgePercent || 0) - tempDiff;
			if (opponentStats.totalStats.surgePercent < 0)
				opponentStats.totalStats.surgePercent = 0;
		}
		desc =
      `Inflicting a stack of **Poison** on ${opponentStats.name} decreasing ` +
      `its **DEF** by __${percent}%__ as well as decreasing lifesteal affects by __${lifestealPercent}%__`;
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
	if (playerStats.totalStats.isToxic) {
		if (round % 3 != 0) {
			abilityDamage = randomNumber(200, 410);
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
            
			desc = `**__${opponentStats.name}__** is effected by **Poison** taking __${abilityDamage}__ damage`;
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
			});
		}
	}
	if (round % 5 === 0) {
		playerStats.totalStats.isToxic = false;
		opponentStats.totalStats.isPoisoned = false;
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage,
	};
};

export const timeBomb = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	let abilityDamage, damageDiff;
	// inflict a stack of time bomb which explodes dealing __20%__ bonus damage based on previous damage dealt.
	if (
		round % 2 === 0 &&
    !opponentStats.totalStats.isStackTB &&
    !playerStats.totalStats.isTB
	) {
		opponentStats.totalStats.isStackTB = true;
		playerStats.totalStats.isTB = true;
		const desc = `inflicting a stack of **Time Bomb** on **__${opponentStats.name}!__**`;
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
	if (round % 2 === 1 && playerStats.totalStats.isTB)
		playerStats.totalStats.isTB = false;
	if (
		opponentStats.totalStats.isStackTB &&
    opponentStats.totalStats.previousDamage
	) {
		const exploded = [ true, false ];
		const explodeRate = [ 50, 50 ];
		if (exploded[probability(explodeRate)]) {
			opponentStats.totalStats.isStackTB = false;
			const percent = calcPercentRatio(20, card.rank);
			abilityDamage = getRelationalDiff(
				opponentStats.totalStats.previousDamage,
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

			const desc = `Time bomb ${emoji.timebomb} has **Exploded** ${emoji.explode}, ` +
            `**__${opponentStats.name}__** takes __${abilityDamage}__ damage.`;
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
			});
		}
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage,
	};
};

export const blizzard = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	// Deal __(13 - 25)%__ additional damage to all enemies each round and decrease their **SPD** by __20%__
	playerStats.totalStats.previousRound ? playerStats.totalStats.previousRound++ : null;
	let abilityDamage;
	if (
		round == playerStats.totalStats.previousRound &&
  !playerStats.totalStats.isUseBlizzardPassive
	) {
		playerStats.totalStats.isUseBlizzardPassive = true;
	}
	if (round % 2 === 0 && !playerStats.totalStats.isBlizzard) {
		playerStats.totalStats.isBlizzard = true;
		const percent = calcPercentRatio(20, card.rank);
		const dexDiff = getRelationalDiff(opponentStats.totalStats.dexterity, percent);
		opponentStats.totalStats.dexterity = opponentStats.totalStats.dexterity - dexDiff;
        
		playerStats.totalStats.previousRound = round;

		const desc = `Decreasing the **SPD** of all enemies by __${percent}%__ ` +
        "as well as Inflicting a stack of **Snow Shards**.\n" +
        "The shards will deal __(13% - 25%)__ true damage for 3 rounds.";
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
	let damageDiff;
	if (playerStats.totalStats.isUseBlizzardPassive && playerStats.totalStats.isBlizzard) {
		if (round % 2 === 1 && playerStats.totalStats.isBlizzard)
			playerStats.totalStats.isBlizzard = false;
		if (round === 5) playerStats.totalStats.isUseBlizzardPassive = false;
		const incPercent = calcPercentRatio(randomNumber(14, 25), card.rank);
		const relDiff = getRelationalDiff(playerStats.totalStats.vitality, incPercent);
		abilityDamage = relDiff;
		opponentStats.totalStats.strength = opponentStats.totalStats.strength - relDiff;
		if (opponentStats.totalStats.strength < 0) opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (damageDiff < 0) damageDiff = 0;
       
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;

		const desc = `**__${opponentStats.name}__** is affected by **Snow Shards** and takes ${relDiff} damage`;
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
		});
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage 
	};
};

export const frost = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	baseEnemyStats
}: BattleProcessProps) => {
	if (!card || !opponentStats.totalStats.originalHp) return;
	// Inflict all enemies with a stack of frost causing your next attack to deal __15%__ 
	// bonus damage based on your **INT** as well as decreasing the **INT** of all enemies by __8%__
	// gain a 5% chance of inflicting frost bite
	let desc, damageDiff, abilityDamage;

	playerStats.totalStats.previousRound ? playerStats.totalStats.previousRound++ : null;
	if (round == playerStats.totalStats.previousRound) {
		if (opponentStats.totalStats.isStunned) {
			opponentStats.totalStats.isStunned = false;
		}
	}

	if (round % 2 === 0 && !playerStats.totalStats.isFrost) {
		playerStats.totalStats.isUseFrostPassive = true;
		playerStats.totalStats.isFrost = true;
		const decPercent = calcPercentRatio(8, card.rank);
		const relDiff = getRelationalDiff(
			baseEnemyStats.totalStats.intelligence,
			decPercent
		);
		opponentStats.totalStats.intelligence = opponentStats.totalStats.intelligence - relDiff;
	
		if (opponentStats.totalStats.intelligence < 0) {
			opponentStats.totalStats.intelligence = baseEnemyStats.totalStats.intelligence;
		}

		desc = `Inflicting a stack of **Frost** on **__${opponentStats.name}__** as well as decreasing ` +
        `its **INT** by __${decPercent}%__`;
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
	if (round % 2 === 1 && playerStats.totalStats.isFrost)
		playerStats.totalStats.isFrost = false;
	if (playerStats.totalStats.isUseFrostPassive && round % 2 !== 0) {
		playerStats.totalStats.isUseFrostPassive = false;
		const damageDealt = getPlayerDamageDealt(playerStats.totalStats, opponentStats.totalStats);
		const percent = calcPercentRatio(15, card.rank);
		const relDiff = getRelationalDiff(damageDealt, percent);
		abilityDamage = relDiff;
		opponentStats.totalStats.strength = opponentStats.totalStats.strength - relDiff;
		if (opponentStats.totalStats.strength <= 0) opponentStats.totalStats.strength = 0;
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (damageDiff <= 0) damageDiff = 0;
        
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;

		const frostBiteChances = [ 5, 95 ];
		const isFrostBite = [ true, false ];

		desc = `**__${opponentStats.name}__** is affected by **Frost**, taking additional __${relDiff}__ damage`;

		if (isFrostBite[probability(frostBiteChances)]) {
			playerStats.totalStats.previousRound = round;
			const frostBiteDesc = `and is affected by **Frost bite** ${emoji.frost} unable to move!`;
			desc = `${desc} ${frostBiteDesc}`;
			opponentStats.totalStats.isStunned = true;
		}

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
		}); 
	}
	return {
		playerStats,
		opponentStats,
		damageDiff,
		abilityDamage 
	};
};
