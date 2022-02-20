import { BattleProcessProps } from "@customTypes/adventure";
import { delay } from "helpers";
import { getPlayerDamageDealt, processHpBar, relativeDiff } from "helpers/battle";

export const BattleProcess = async ({
	baseEnemyStats,
	basePlayerStats,
	isPlayerFirst,
	playerStats,
	opponentStats,
}: BattleProcessProps) => {
	if (!opponentStats) {
		throw new Error("Unable to process opponent");
	}
	let damageDiff = 1,
		damageDealt = 0;
		// isPassiveDefeat = false,
		// isPassiveSelfDefeat = false;

	damageDealt = getPlayerDamageDealt(
		basePlayerStats.totalStats,
		baseEnemyStats.totalStats
	);
	opponentStats.totalStats.strength =
    opponentStats.totalStats.strength - damageDealt;
	if (!opponentStats.totalStats.originalHp) throw new Error("Unprocessable OriginalHP");
	damageDiff = relativeDiff(
		opponentStats.totalStats.strength,
		opponentStats.totalStats.originalHp
	);
	if (damageDiff < 0) damageDiff = 0;
	opponentStats = processHpBar(opponentStats, damageDiff);
	await delay(1000);
	return {
		damageDiff,
		opponentStats,
		damageDealt,
		// isPlayerStunned: playerStats.totalStats.isStun,
		isCriticalHit: playerStats.totalStats.isCriticalHit,
		// isSleep: playerStats.totalStats.isSleep,
		// isPassiveDefeat,
		// isPassiveSelfDefeat,
		basePlayerStats,
		baseEnemyStats,
	};
};
