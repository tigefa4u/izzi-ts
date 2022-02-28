import { BattleProcessProps } from "@customTypes/adventure";
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

export const BattleProcess = async ({
	baseEnemyStats,
	basePlayerStats,
	isPlayerFirst,
	playerStats,
	opponentStats,
	embed,
	round,
	message
}: BattleProcessProps) => {
	if (!opponentStats) {
		throw new Error("Unable to process opponent");
	}
	let damageDiff = 1,
		damageDealt = 0,
		isAbilityDefeat = false,
		isAbilitySelfDefeat = false;
		// "duskblade of draktharr"
	const { abilityProc, abilityDamage, isDefeated, forfeit } = await processAbililtyOrItemProc({
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
	if (playerStats.totalStats.accuracy > opponentStats.totalStats.evasion) {
		opponentStats.totalStats.isEvadeHit = false;
	}
	if (!isDefeated) {
		damageDealt = getPlayerDamageDealt(
			playerStats.totalStats,
			opponentStats.totalStats
		);
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
		if ((abilityProc?.damageDiff || 0) <= 0) {
			isAbilityDefeat = true;
		} else if ((abilityProc?.playerDamageDiff || 0) <= 0) {
			isAbilitySelfDefeat = true;
		}
	}

	return {
		damageDiff,
		opponentStats,
		damageDealt,
		// isPlayerStunned: playerStats.totalStats.isStun,
		isCriticalHit: playerStats.totalStats.isCriticalHit,
		// isSleep: playerStats.totalStats.isSleep,
		basePlayerStats,
		baseEnemyStats,
		isAbilityDefeat,
		isAbilitySelfDefeat
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
		let abilityProc = {} as AbilityProcReturnType | undefined,
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
				const itemCallable = itemProcMap[card.itemname as keyof ItemProcMapProps];
				if (typeof itemCallable === "function") {
					const itemProc = itemCallable(params);
					if (itemProc) {
						playerStats.totalStats = itemProc.playerStats.totalStats;
						opponentStats.totalStats = itemProc.opponentStats.totalStats;

						if (isPlayerFirst) {
							basePlayerStats.totalStats = clone(itemProc.basePlayerStats.totalStats);
						} else {
							baseEnemyStats.totalStats = clone(itemProc.basePlayerStats.totalStats);
						}
						await delay(1000);
					}
				}
			}

			const callable =
      abilityProcMap[card.abilityname as keyof AbilityProcMapProps];
			if (typeof callable !== "function") continue;
			abilityProc = callable(params);
			if (abilityProc) {
				playerStats = abilityProc.playerStats;
				opponentStats = abilityProc.opponentStats;
			}
			if (abilityProc?.abilityDamage) {
				abilityDamage = abilityDamage + abilityProc.abilityDamage;
			}
			await delay(1000);
			if (
				(abilityProc?.playerDamageDiff || 1) <= 0 ||
      (abilityProc?.damageDiff || 1) <= 0
			) {
				isDefeated = true;
				break;
			}
		}
		return {
			playerStats,
			opponentStats,
			abilityProc,
			abilityDamage,
			isDefeated
		};
	} catch (err) {
		loggers.error("modules.commands.rpg.adventure.battle.battleProcess(): something went wrong", err);
		return { forfeit: true };
	}
}
