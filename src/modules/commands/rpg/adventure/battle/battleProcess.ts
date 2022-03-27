import { BattleProcessProps, BattleStats } from "@customTypes/adventure";
import {
	AbilityProcMapProps,
	AbilityProcReturnType,
	ItemProcMapProps,
} from "@customTypes/battle";
import { delay } from "helpers";
import {
	getPlayerDamageDealt,
	processHpBar,
	relativeDiff,
} from "helpers/battle";
import loggers from "loggers";
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

export const BattleProcess = async ({
	baseEnemyStats,
	basePlayerStats,
	isPlayerFirst,
	playerStats,
	opponentStats,
	embed,
	round,
	message,
}: BattleProcessProps) => {
	if (!opponentStats) {
		throw new Error("Unable to process opponent");
	}
	let damageDiff = 1,
		damageDealt = 0,
		isAbilityDefeat = false,
		isAbilitySelfDefeat = false;
	// "duskblade of draktharr"
	const {
		abilityProc, abilityDamage, isDefeated, forfeit, ...rest 
	} =
    await processAbililtyOrItemProc({
    	baseEnemyStats,
    	basePlayerStats,
    	isPlayerFirst,
    	playerStats,
    	opponentStats,
    	embed,
    	round,
    	message,
    });
	if (forfeit) {
		return { forfeit };
	}
	if (rest.playerStats) {
		playerStats.totalStats = rest.playerStats.totalStats;
		opponentStats.totalStats = rest.opponentStats.totalStats;
	}

	if (playerStats.totalStats.accuracy > opponentStats.totalStats.evasion) {
		opponentStats.totalStats.isEvadeHit = false;
	}
	playerStats.totalStats = processStack(playerStats.totalStats);
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

		await delay(1000);
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
		basePlayerStats,
		baseEnemyStats,
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
	embed,
	round,
	message,
}: BattleProcessProps) {
	try {
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
				embed,
				message,
				opponentStats,
			} as BattleProcessProps;
			if (card.itemname) {
				const itemCallable =
          itemProcMap[card.itemname as keyof ItemProcMapProps];
				if (typeof itemCallable === "function") {
					const itemProc = itemCallable(params);
					if (itemProc) {
						abilityDamage = abilityDamage + (itemProc.itemDamage || 0);
						playerStats.totalStats = itemProc.playerStats.totalStats;
						opponentStats.totalStats = itemProc.opponentStats.totalStats;

						if (isPlayerFirst) {
							basePlayerStats.totalStats = clone(
								itemProc.basePlayerStats.totalStats
							);
						} else {
							baseEnemyStats.totalStats = clone(
								itemProc.basePlayerStats.totalStats
							);
						}
						await delay(1000);

						if (itemProc.damageDiff && itemProc.damageDiff <= 0) {
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
        !playerStats.totalStats.isHarbingerOfDeath
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
			await delay(1000);
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
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.adventure.battle.battleProcess(): something went wrong",
			err
		);
		return { forfeit: true };
	}
}
