import { BattleProcessProps, BattleStats } from "@customTypes/adventure";
import {
	AbilityProcMapProps,
	AbilityProcReturnType,
	ItemProcMapProps,
} from "@customTypes/battle";
import { calcPercentRatio } from "helpers/ability";
import { calculateSkillProcRound } from "helpers/abilityProc";
import {
	getPercentOfTwoNumbers,
	getPlayerDamageDealt,
	processEnergyBar,
	processHpBar,
	processStatDeBuffCap,
	relativeDiff,
} from "helpers/battle";
import { DPR_MAX_BUFF, HARBINGER_OF_DEATH_PROC_ROUND } from "helpers/constants/constants";
import { clone } from "utility";
import abilityProcMap from "../abilityProcs/index";
import itemProcMap from "../itemProcs/index";

type S = BattleStats["totalStats"];
type Stack = Pick<
  S,
  | "isRage"
  | "isBerserk"
  | "isRevit"
  | "isGuardian"
  | "isKiller"
  | "isFuture"
  | "isEclipse"
  | "isSpirit"
  | "isPred"
  | "isBstrike"
  | "isSB"
  | "isTornado"
  | "isHarbingerOfDeath"
  | "isLifestealProc"
  | "isRapid"
  | "isLastStand"
  | "isLeer"
  | "isLightningShield"
  | "isCleanse"
  | "isUseBleed"
  | "isDominator"
>;
function processStack(stats: Stack) {
	[
		"isRage",
		"isBerserk",
		"isRevit",
		"isGuardian",
		"isKiller",
		"isFuture",
		"isEclipse",
		"isSpirit",
		"isPred",
		"isBstrike",
		"isSB",
		"isTornado",
		"isHarbingerOfDeath",
		"isLifestealProc",
		"isRapid",
		"isLastStand",
		"isLeer",
		"isLightningShield",
		"isCleanse",
		"isUseBleed",
		"isDominator",
	].map((stat) => {
		if (stats[stat as keyof Stack]) {
			stats[stat as keyof Stack] = false;
		}
	});
	return stats as S;
}

function processLifesteals(stats: S, damageDealt: number, num: number) {
	const st = clone(stats);
	if (!st.originalHp) {
		throw new Error("Unprocessable originalHp");
	}
	const relDiff = Math.floor(damageDealt * (num / 100));
	st.strength = st.strength + relDiff;
	if (st.strength > st.originalHp) st.strength = st.originalHp;
	let damageDiff = relativeDiff(st.strength, st.originalHp);
	if (damageDiff < 0) damageDiff = 0;
	const processedHpbar = processHpBar(st, damageDiff);
	st.health = processedHpbar.health;
	st.strength = processedHpbar.strength;
	return st;
}

function processUnableToAttack<T extends BattleStats>(
	playerStats: T,
	opponentStats: T,
	allowProcOnEvadeHit = false
) {
	return (
		playerStats.totalStats.isAsleep ||
    playerStats.totalStats.isStunned ||
    playerStats.totalStats.isParanoid ||
    (allowProcOnEvadeHit === true &&
    opponentStats.totalStats.isEvadeHit === true
    	? false
    	: opponentStats.totalStats.isEvadeHit)
	);
}

// Not more than 125%
const capDPRBuff = (num: number) => {
	if (num > DPR_MAX_BUFF) return DPR_MAX_BUFF;
	return num;
};

const checkZombieAura = (opponent: BattleStats) => {
	const stats = clone(opponent);
	if (stats.surviveRoundsAfterDeath && stats.surviveRoundsAfterDeath > 0 && stats.totalStats.strength <= 0) {
		stats.surviveRoundsAfterDeath = stats.surviveRoundsAfterDeath - 1;
		stats.totalStats.strength = 1;
	}
	return stats;
};

export const BattleProcess = async ({
	baseEnemyStats: baseEnemy,
	basePlayerStats: basePlayer,
	isPlayerFirst,
	playerStats,
	opponentStats,
	round,
	simulation,
	isRaid,
	multiplier,
}: BattleProcessProps) => {
	// Need to clone base stats as its been overridden
	const baseEnemyStats = clone(baseEnemy);
	const basePlayerStats = clone(basePlayer);
	if (!opponentStats) {
		throw new Error("Unable to process opponent");
	}
	let damageDiff = 1,
		damageDealt = 0,
		isDamageAbsorbed = false,
		isAbilityDefeat = false,
		isAbilitySelfDefeat = false,
		hasZombieAura = false;
	// "duskblade of draktharr"
	const { abilityProc, abilityDamage, isDefeated, ...rest } =
    await processAbililtyOrItemProc({
    	baseEnemyStats,
    	basePlayerStats,
    	isPlayerFirst,
    	playerStats,
    	opponentStats,
    	round,
    	simulation,
    	isRaid,
    	multiplier,
    });
	if (rest.playerStats) {
		playerStats.totalStats = rest.playerStats.totalStats;
		opponentStats.totalStats = rest.opponentStats.totalStats;
	}

	if (playerStats.totalStats.accuracy > opponentStats.totalStats.evasion) {
		opponentStats.totalStats.isEvadeHit = false;
	}
	playerStats.totalStats = processStack(playerStats.totalStats);
	// playerStats.totalStats = processStatBuffCap(
	// 	playerStats.totalStats,
	// 	isPlayerFirst ? basePlayerStats.totalStats : baseEnemyStats.totalStats
	// );

	// // This logic makes sure that stats do not drop below 10% of base stats
	playerStats.totalStats = processStatDeBuffCap(
		playerStats.totalStats,
		basePlayerStats.totalStats
	);
	opponentStats.totalStats = processStatDeBuffCap(
		opponentStats.totalStats,
		baseEnemyStats.totalStats
	);

	playerStats.totalStats.dpr = capDPRBuff(playerStats.totalStats.dpr);
	opponentStats.totalStats.dpr = capDPRBuff(opponentStats.totalStats.dpr);

	// Reset rapid fire bonus damage percent
	// if player is unable to attack
	const unableToAttack = processUnableToAttack(playerStats, opponentStats);
	if (unableToAttack && !opponentStats.totalStats.isEvadeHit) {
		const cardHasRapidFire = playerStats.cards.find(
			(c) => c?.abilityname === "rapid fire"
		);
		if (cardHasRapidFire) {
			// rapid fire is 35%
			const percent = calcPercentRatio(35, cardHasRapidFire.rank);
			playerStats.totalStats.damageBuildUpPercent = {
				...playerStats.totalStats.damageBuildUpPercent,
				"rapid fire": {
					percent: percent,
					basePercent: percent,
				},
			};
		}
	}
	// 	/**
	//    * If player evades consume some % INT
	//		(Not a good change)
	//    */
	// 	if (opponentStats.totalStats.isEvadeHit) {
	// 		const intToReduce = baseEnemyStats.totalStats.intelligence * 0.15;
	// 		opponentStats.totalStats.intelligence =
	//       opponentStats.totalStats.intelligence - intToReduce;
	// 		if (opponentStats.totalStats.intelligence < 0) {
	// 			opponentStats.totalStats.intelligence = 0;
	// 		}

	// 		let diff = getPercentOfTwoNumbers(
	// 			opponentStats.totalStats.intelligence,
	// 			baseEnemyStats.totalStats.intelligence
	// 		);
	// 		if (diff < 0 || isNaN(diff)) diff = 0;
	// 		const opponentEnergy = processEnergyBar({
	// 			dpr: diff,
	// 			energy: opponentStats.totalStats.energy,
	// 		});
	// 		opponentStats.totalStats.dpr = opponentEnergy.dpr;
	// 		opponentStats.totalStats.energy = opponentEnergy.energy;
	// 	}
	if (!isDefeated && !unableToAttack) {
		damageDealt = getPlayerDamageDealt(
			playerStats.totalStats,
			opponentStats.totalStats,
			round
		);
		playerStats.totalStats.previousDamage = damageDealt;
		if (playerStats.totalStats.isSurge) {
			playerStats.totalStats = processLifesteals(
				playerStats.totalStats,
				damageDealt,
				playerStats.totalStats.surgePercent || 85
			);
		}
		if (playerStats.totalStats.isLifesteal) {
			playerStats.totalStats = processLifesteals(
				playerStats.totalStats,
				damageDealt,
				playerStats.totalStats.lifestealPercent || 45
			);
		}

		/**
     * INT acts as a shield which absorbs damage
     * if INT is 0 only then hp starts to reduce.
     */

		if (damageDealt > opponentStats.totalStats.intelligence) {
			if (opponentStats.totalStats.intelligence < 0)
				opponentStats.totalStats.intelligence = 0;
			const damageToDeal = damageDealt - opponentStats.totalStats.intelligence;
			opponentStats.totalStats.intelligence = 0;

			opponentStats.totalStats.strength = Math.floor(
				opponentStats.totalStats.strength - damageToDeal
			);

			// damageDealt = damageToDeal;
			isDamageAbsorbed = false;
		} else if (damageDealt <= opponentStats.totalStats.intelligence) {
			opponentStats.totalStats.intelligence =
        opponentStats.totalStats.intelligence - damageDealt;
			if (opponentStats.totalStats.intelligence < 0)
				opponentStats.totalStats.intelligence = 0;

			isDamageAbsorbed = true;
		}

		// 	opponentStats.totalStats.strength =
		//   opponentStats.totalStats.strength - damageDealt;

		/**
     * DPR just visual rep of INT %
     */
		let diff = getPercentOfTwoNumbers(
			opponentStats.totalStats.intelligence,
			baseEnemyStats.totalStats.intelligence
		);
		if (diff < 0 || isNaN(diff)) diff = 0;
		const opponentEnergy = processEnergyBar({
			dpr: diff,
			energy: opponentStats.totalStats.energy,
		});
		opponentStats.totalStats.dpr = opponentEnergy.dpr;
		opponentStats.totalStats.energy = opponentEnergy.energy;

		if (
			!opponentStats.totalStats.originalHp ||
      isNaN(opponentStats.totalStats.originalHp)
		)
			throw new Error("Unprocessable OriginalHP");
		
		const survive = checkZombieAura(opponentStats);
		if (survive.totalStats.strength === 1) {
			opponentStats.totalStats.strength = survive.totalStats.strength;
			opponentStats.surviveRoundsAfterDeath = survive.surviveRoundsAfterDeath;
			hasZombieAura = true;
		}
		damageDiff = relativeDiff(
			opponentStats.totalStats.strength,
			opponentStats.totalStats.originalHp
		);
		if (damageDiff < 0) damageDiff = 0;
		const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
		opponentStats.totalStats.health = processedHpBar.health;
		opponentStats.totalStats.strength = processedHpBar.strength;

		// await delay(1000); // Need to figure out
	} else {
		if ((abilityProc?.damageDiff ?? 1) <= 0) {
			isAbilityDefeat = true;
		} else if ((abilityProc?.playerDamageDiff ?? 1) <= 0) {
			isAbilitySelfDefeat = true;
		}
		const survive = checkZombieAura(opponentStats);
		if (survive.totalStats.strength === 1) {
			opponentStats.totalStats.strength = survive.totalStats.strength;
			opponentStats.surviveRoundsAfterDeath = survive.surviveRoundsAfterDeath;
			isAbilityDefeat = false;
			isAbilitySelfDefeat = false;
			damageDiff = 1;
			hasZombieAura = true;
			const processedHpBar = processHpBar(opponentStats.totalStats, damageDiff);
			opponentStats.totalStats.strength = processedHpBar.strength;
			opponentStats.totalStats.health = processedHpBar.health;
		}
	}
	// Directly add ability damage to total damage
	// will cause visual bug
	// damageDealt = damageDealt + (abilityDamage || 0);
	let isPlayerParanoid = false;
	if (playerStats.totalStats.isParanoid) {
		isPlayerParanoid = true;
		playerStats.totalStats.isParanoid = false;
	}
	return {
		damageDiff,
		opponentStats,
		damageDealt,
		playerStats,
		isPlayerStunned: playerStats.totalStats.isStunned,
		isPlayerAsleep: playerStats.totalStats.isAsleep,
		isOpponentEvadeHit: opponentStats.totalStats.isEvadeHit,
		isCriticalHit: playerStats.totalStats.isCriticalHit,
		basePlayerStats: isPlayerFirst ? basePlayerStats : baseEnemyStats,
		baseEnemyStats: isPlayerFirst ? baseEnemyStats : basePlayerStats,
		isAbilityDefeat,
		isAbilitySelfDefeat,
		abilityDamage,
		isPlayerParanoid,
		isDamageAbsorbed,
		hasZombieAura
	};
};

async function processAbililtyOrItemProc({
	baseEnemyStats,
	basePlayerStats,
	isPlayerFirst,
	playerStats,
	opponentStats,
	round,
	simulation,
	isRaid,
	multiplier,
}: BattleProcessProps) {
	let abilityProc = {} as AbilityProcReturnType,
		abilityDamage = 0,
		isDefeated = false;

	for (let i = 0; i < 3; i++) {
		const card = playerStats.cards[i] as any;
		if (!card) continue;

		const params = {
			playerStats,
			baseEnemyStats,
			basePlayerStats,
			card,
			isPlayerFirst,
			round,
			opponentStats,
			simulation,
			isRaid,
			multiplier,
		} as BattleProcessProps;
		if (card.itemname) {
			const itemCallable = itemProcMap[card.itemname as keyof ItemProcMapProps];
			if (typeof itemCallable === "function") {
				const itemProc = itemCallable(params);
				if (itemProc) {
					abilityDamage = abilityDamage + (itemProc.itemDamage || 0);
					playerStats.totalStats = itemProc.playerStats.totalStats;
					opponentStats.totalStats = itemProc.opponentStats.totalStats;

					// if (isPlayerFirst) {
					basePlayerStats.totalStats = clone(
						itemProc.basePlayerStats.totalStats
					);
					// } else {
					// 	baseEnemyStats.totalStats = clone(
					// 		itemProc.basePlayerStats.totalStats
					// 	);
					// }
					// await delay(1000);

					if ((itemProc.damageDiff ?? 1) <= 0) {
						isDefeated = true;
						abilityProc.damageDiff = 0;
						break;
					}
				}
			}
		}
		const hasHarbingerOrCleanse = card.abilityname === "harbinger of death" || card.abilityname === "cleanse";
		const procRound = calculateSkillProcRound(HARBINGER_OF_DEATH_PROC_ROUND, card.reduceSkillCooldownBy);
		if (
			(processUnableToAttack(playerStats, opponentStats, true) ||
        playerStats.totalStats.isRestrictResisted) &&
      !(
      	hasHarbingerOrCleanse &&
        round % procRound === 0
      )
      //   !(
      //   	playerStats.cards.find(
      //   		(c) => (c?.abilityname === "harbinger of death" || c?.abilityname === "cleanse")
      //   	) && round % HARBINGER_OF_DEATH_PROC_ROUND === 0
      //   )
		)
			continue;

		const callable =
      abilityProcMap[card.abilityname as keyof AbilityProcMapProps];
		if (typeof callable !== "function") continue;
		abilityProc = callable(params) || ({} as AbilityProcReturnType);
		if (abilityProc) {
			playerStats = abilityProc.playerStats;
			opponentStats = abilityProc.opponentStats;
		}
		if (abilityProc?.abilityDamage) {
			abilityDamage = abilityDamage + abilityProc.abilityDamage;
		}
		// await delay(1000);
		if (abilityProc) {
			if (
				(abilityProc.damageDiff ?? 1) <= 0 ||
        (abilityProc.playerDamageDiff ?? 1) <= 0
			) {
				isDefeated = true;
				break;
			}
		}
	}

	return {
		playerStats,
		opponentStats,
		abilityProc,
		abilityDamage,
		isDefeated,
	};
}
