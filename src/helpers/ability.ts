type T = { [key: string]: { operator: string; number: number; }};

export const calcPercentRatio = (num: number, rank: string) => {
	const rankRatio: T = {
		silver: {
			operator: "-",
			number: 2,
		},
		gold: {
			operator: "-",
			number: 2,
		},
		platinum: {
			operator: "-",
			number: 4,
		},
		diamond: {
			operator: "-",
			number: 4,
		},
		legend: {
			operator: "-",
			number: 8,
		},
		divine: {
			operator: "+",
			number: 8,
		},
		immortal: {
			operator: "+",
			number: 12,
		},
		exclusive: {
			operator: "+",
			number: 12,
		},
		ultimate: {
			operator: "+",
			number: 14,
		},
	};
  
	// const operators = {
	//   "+": (x, y) => x + y,
	//   "-": (x, y) => x - y,
	// };
  
	const ratio = rankRatio[rank];
	// let percent = (ratio.number / 100);
	const temp = num + ratio.number;
	return temp;
	// num = operators[ratio.operator](num, temp);
	// num = num + temp;
	// Number.EPSILON can be used to round off decimal numbers
	// num = Math.round((num + Number.EPSILON) * 100) / 100;
	// return Math.floor(num);
};

export const statRelationMap = {
	vitality: "ATK",
	defense: "DEF",
	dexterity: "SPD",
	intelligence: "INT",
	strength: "HP",
	critical: "CRIT",
	accuracy: "ACC",
	evasion: "EVA",
	precision: "PREC"
};