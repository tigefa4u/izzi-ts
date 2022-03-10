import { OverallStatsProps } from "@customTypes";
import { BattleStats } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { RaidLobbyProps, RaidProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { prepareHPBar } from "./adventure";

export const prepareRaidBossBase = (raid: RaidProps, isEvent = false) => {
	const stats = raid.stats.battle_stats.stats;
	const totalStats = {} as OverallStatsProps;
	Object.keys(stats).map((stat) => {
		if (![ "critical", "accuracy", "precision", "evasion", "strength", "originalHp" ].includes(stat)) {
			Object.assign(totalStats, {
				[stat]: Math.round(
					stats[stat as keyof CharacterStatProps] * 3
				),
			});
		}
	});
	return {
		totalStats: {
			...totalStats,
			health: prepareHPBar(),
			character_level: raid.stats.battle_stats.boss_level,
			criticalDamage: 1,
			effective: 1,
		},
		id: "boss",
		cards: isEvent ? [ undefined, raid.raid_boss[0], undefined ] : raid.raid_boss,
		name: `XeneX's ${isEvent ? "Event" : "Raid"} Boss`
	} as BattleStats;
};

export const getLobbyMvp = (lobby: RaidLobbyProps) => {
	const keys = Object.keys(lobby).map(Number);
	const maxDmg = Math.max(...keys.map((k) => lobby[k].total_damage));
	if (maxDmg === 0) {
		return;
	}
	const mvpArr = keys.filter((k) => lobby[k].total_damage === maxDmg);
	let mvp = mvpArr[0];
	if (mvpArr.length > 1) {
		const minAtk = Math.min(...mvpArr.map((k) => lobby[k].total_attack));
		mvp = mvpArr.filter((k) => lobby[k].total_attack === minAtk)[0];
	}
	return mvp;
};

export const refillEnergy = async (id: number, lobby: RaidLobbyProps) => {
	const keys = Object.keys(lobby).map(Number);
	keys.map((k) => {
		if (lobby[k].energy < lobby[k].total_energy) {
			lobby[k].energy = lobby[k].energy + 4;
		}
	});
	await updateRaid({ id }, { lobby });
	return;
};