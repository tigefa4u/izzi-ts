import { XPGainPerRankProps } from "@customTypes";
import { RankProps, RanksMetaProps } from "../helperTypes";

export const ranksMeta: RanksMetaProps = {
	silver: {
		size: 1,
		rank_id: 1,
		color: "#b6c7be",
		emoji: "bronzestar",
		name: "silver"
	},
	gold: {
		size: 2,
		rank_id: 2,
		color: "#c89e50",
		emoji: "bronzestar",
		name: "gold"
	},
	platinum: {
		size: 3,
		rank_id: 3,
		color: "#298077",
		emoji: "bronzestar",
		name: "platinum"
	},
	diamond: {
		size: 1,
		rank_id: 4,
		color: "#73c0d3",
		emoji: "silverstar",
		name: "diamond"
	},
	legend: {
		size: 2,
		rank_id: 5,
		color: "#c11b17",
		emoji: "silverstar",
		name: "legend"
	},
	divine: {
		size: 3,
		rank_id: 6,
		color: "#c35817",
		emoji: "silverstar",
		name: "divine"
	},
	immortal: {
		size: 1,
		rank_id: 7,
		color: "#b641c4",
		emoji: "goldstar",
		name: "immortal"
	},
	exclusive: {
		size: 2,
		rank_id: 8,
		emoji: "goldstar",
		name: "exclusive"
	},
	ultimate: {
		size: 3,
		rank_id: 9,
		max_level: 70,
		emoji: "goldstar",
		name: "ultimate"
	},
	mythical: {
		size: 4,
		rank_id: 10,
		max_level: 70,
		emoji: "goldstar",
		name: "mythical"
	},
};

export const XP_GAIN_PER_RANK = {
	/**
   * These changes are related to condensed fodders.
   * Since there will only be platinum fodders the xp gain
   * is the average of silver (100) + gold (150) + plat (200)
   */
	[ranksMeta.silver.name]: 170, // 100
	[ranksMeta.gold.name]: 170,
	[ranksMeta.platinum.name]: 170, // 200
	[ranksMeta.diamond.name]: 250,
	[ranksMeta.legend.name]: 300,
	[ranksMeta.divine.name]: 450,
	[ranksMeta.immortal.name]: 500,
	[ranksMeta.exclusive.name]: 800,
	[ranksMeta.ultimate.name]: 800,
	[ranksMeta.mythical.name]: 1000,
} as XPGainPerRankProps;
