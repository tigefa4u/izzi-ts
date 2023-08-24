import { OverallStatsProps } from "@customTypes";
import { BattleStats } from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { RaidLobbyProps, RaidProps } from "@customTypes/raids";
import { updateRaidEnergy } from "api/controllers/RaidsController";
import { clone } from "utility";
import { prepareEnergyBar, prepareHPBar } from "./adventure";
import { DEFAULT_DPR } from "./constants";

export const prepareRaidBossBase = (raid: RaidProps, isEvent = false) => {
	const stats = raid.stats.battle_stats.stats;
	const totalStats = {} as OverallStatsProps;
	Object.keys(stats).map((stat) => {
		const key = stat as keyof CharacterStatProps;
		if (![ "critical", "accuracy", "precision", "evasion", "strength", "originalHp" ].includes(stat)) {
			Object.assign(totalStats, {
				[stat]: Math.round(
					stats[key] * 2.5
				),
			});
		} else if ([ "strength", "originalHp" ].includes(stat)) {
			Object.assign(totalStats, {
				[stat]: Math.round(
					stats[key] * 30
				)
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
			energy: prepareEnergyBar(),
			dpr: clone(DEFAULT_DPR)
		},
		id: "boss",
		cards: (isEvent || raid.raid_boss.length === 1) ? [ undefined, raid.raid_boss[0], undefined ] : raid.raid_boss,
		name: `XeneX's ${isEvent ? "Event" : "Raid"} Boss`
	} as BattleStats;
};

export const getLobbyMvp = (lobby: RaidLobbyProps) => {
	const keys = Object.keys(lobby).map(Number);
	if (keys.length <= 1) {
		return;
	}
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
	if (keys.length > 0) {
		keys.map((k) => {
			if (lobby[k].energy < lobby[k].total_energy) {
				lobby[k].energy = lobby[k].energy + 5;
			}
		});
		// await updateRaid({ id }, { lobby });
		await updateRaidEnergy({ id }, lobby);
	}
	return;
};