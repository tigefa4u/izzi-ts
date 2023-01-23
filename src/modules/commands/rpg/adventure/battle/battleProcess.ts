import { BattleProcessProps, BattleStats } from "@customTypes/adventure";
import {
	AbilityProcMapProps,
	AbilityProcReturnType,
	ItemProcMapProps,
} from "@customTypes/battle";
import {
	getPlayerDamageDealt,
	processHpBar,
	relativeDiff,
} from "helpers/battle";
import {
	ABILITY_BUFF_MAX_PERCENT,
	HARBINGER_OF_DEATH_PROC_ROUND,
} from "helpers/constants";
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
		"isRapid"
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
    (allowProcOnEvadeHit === true &&
    opponentStats.totalStats.isEvadeHit === true
    	? false
    	: opponentStats.totalStats.isEvadeHit)
	);
}

function capStatBuff(x1: number, x2: number) {
	const maxBuff = Math.ceil((ABILITY_BUFF_MAX_PERCENT / 100) * x2);
	const buffCap = x2 + maxBuff;
	if (x1 > buffCap) {
		return Math.ceil(buffCap);
	}
	return x1;
}

type B = BattleStats["totalStats"];
function processStatBuffCap(stats: B, baseStats: B) {
	stats.vitality = capStatBuff(stats.vitality, baseStats.vitality);
	stats.defense = capStatBuff(stats.defense, baseStats.defense);
	stats.intelligence = capStatBuff(
		stats.intelligence,
		baseStats.intelligence
	);
	stats.dexterity = capStatBuff(stats.dexterity, baseStats.dexterity);
	return stats;
}

export const BattleProcess = async ({
	baseEnemyStats,
	basePlayerStats,
	isPlayerFirst,
	playerStats,
	opponentStats,
	round,
	simulation,
	isRaid,
	multiplier,
}: BattleProcessProps) => {
	if (!opponentStats) {
		throw new Error("Unable to process opponent");
	}
	let damageDiff = 1,
		damageDealt = 0,
		isAbilityDefeat = false,
		isAbilitySelfDefeat = false;
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
	if (!isDefeated && !processUnableToAttack(playerStats, opponentStats)) {
		damageDealt = getPlayerDamageDealt(
			playerStats.totalStats,
			opponentStats.totalStats
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

		opponentStats.totalStats.strength =
      opponentStats.totalStats.strength - damageDealt;
		if (
			!opponentStats.totalStats.originalHp ||
      isNaN(opponentStats.totalStats.originalHp)
		)
			throw new Error("Unprocessable OriginalHP");
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
	}
	// Directly add ability damage to total damage
	// will cause visual bug
	// damageDealt = damageDealt + (abilityDamage || 0);

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
		const card = playerStats.cards[i];
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
		if (
			(processUnableToAttack(playerStats, opponentStats, true) ||
        playerStats.totalStats.isRestrictResisted) &&
      !(
      	playerStats.cards.find(
      		(c) => c?.abilityname === "harbinger of death"
      	) && round % HARBINGER_OF_DEATH_PROC_ROUND === 0
      )
		)
			break;

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
