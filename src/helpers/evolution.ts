import { ranksMeta } from "./constants/rankConstants";

type T = {
  [key: number]: number;
};
const soulMap: T = {
	[ranksMeta.legend.rank_id]: 1.4,
	[ranksMeta.divine.rank_id]: 1.75,
	[ranksMeta.immortal.rank_id]: 1.95,
	[ranksMeta.exclusive.rank_id]: 1.95,
	[ranksMeta.ultimate.rank_id]: 1.99,
	[ranksMeta.mythical.rank_id]: 2.12
};

export function getReqSouls(rank_id: number): number {
	let op = "ceil",
		multiplier = 1.95;
	if (rank_id <= 4) {
		multiplier = 1.3;
		op = "floor";
	} else {
		multiplier = soulMap[rank_id as keyof T];
	}
	if (op === "ceil") {
		return Math.ceil(rank_id ** multiplier);
	}
	return Math.floor(rank_id ** multiplier);
}