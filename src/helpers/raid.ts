import { BattleStats } from "@customTypes/adventure";
import { RaidProps } from "@customTypes/raids";
import { prepareHPBar } from "./adventure";

export const prepareRaidBossBase = (raid: RaidProps, isEvent = false) => {
	const stats = raid.stats.battle_stats;
	return {
		totalStats: {
			...stats.stats,
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