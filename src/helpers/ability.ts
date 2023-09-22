import { RankProps } from "./helperTypes";
import { ranksMeta } from "./rankConstants";

type T = { [key: string]: { operator: string; number: number; }};

export const calcPercentRatio = (num: number, rank: RankProps) => {
	const rankRatio: T = {
		[ranksMeta.silver.name]: {
			operator: "-",
			number: 2,
		},
		[ranksMeta.gold.name]: {
			operator: "-",
			number: 2,
		},
		[ranksMeta.platinum.name]: {
			operator: "-",
			number: 4,
		},
		[ranksMeta.diamond.name]: {
			operator: "-",
			number: 4,
		},
		[ranksMeta.divine.name]: {
			operator: "-",
			number: 8,
		},
		[ranksMeta.legend.name]: {
			operator: "+",
			number: 8,
		},
		[ranksMeta.immortal.name]: {
			operator: "+",
			number: 12,
		},
		[ranksMeta.exclusive.name]: {
			operator: "+",
			number: 12,
		},
		[ranksMeta.ultimate.name]: {
			operator: "+",
			number: 14,
		},
		[ranksMeta.mythical.name]: {
			operator: "+",
			number: 16
		}
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

export const statRelationMap: any = {
	vitality: "ATK",
	defense: "DEF",
	dexterity: "SPD",
	intelligence: "ARM",
	strength: "HP",
	critical: "CRIT",
	accuracy: "ACC",
	evasion: "EVA",
	precision: "PREC"
};