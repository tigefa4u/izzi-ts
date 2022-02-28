type T = {
  [key: number]: number;
};
const soulMap: T = {
	5: 1.4,
	6: 1.75,
	7: 1.95,
	8: 1.95,
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