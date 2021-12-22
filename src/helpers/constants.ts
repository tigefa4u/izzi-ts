import { ElementTypeColorProps, StarLenProps } from "./helperTypes";

export const BASE_XP = 10;

export const XP_GAIN_EXPONENT = 1.5;

export const BASE_RANK = "silver";
export const STARTER_CARD_RANK = "diamond";
export const STARTER_CARD_RANK_ID = 4;
export const STARTER_CARD_LEVEL = 20;
export const STARTER_CARD_EXP = 1;
export const STARTER_CARD_R_EXP = Math.floor(BASE_XP * STARTER_CARD_LEVEL ** XP_GAIN_EXPONENT);
export const STARTER_GOLD = 0;

export const starlen: StarLenProps = {
	silver: {
		size: 1,
		color: "#b6c7be",
	},
	gold: {
		size: 2,
		color: "#c89e50",
	},
	platinum: {
		size: 3,
		color: "#298077",
	},
	diamond: {
		size: 4,
		color: "#73c0d3",
	},
	legend: {
		size: 5,
		color: "#c11b17",
	},
	divine: {
		size: 6,
		color: "#c35817",
	},
	immortal: {
		size: 7,
		color: "#b641c4",
	},
	exclusive: { size: 8, },
	ultimate: { size: 9, },
};

export const elementTypeColors: ElementTypeColorProps = {
	electric: "#fdd023",
	water: "#488ac7",
	wind: "#78866b",
	grass: "#4aa02c",
	poison: "#660033",
	light: "#f6f6d5",
	dark: "#080808",
	crystal: "#87afc7",
	fire: "#e42217",
	ground: "#8c3b0c",
	neutral: "#696969",
};

export const GAMBLE_EMOJIS = {
	win: "https://steamuserimages-a.akamaihd.net/ugc/934963761848054623/30A7F738E18CB5A05454486D51CBADFC2A82E451/",
	loss: "https://i.pinimg.com/originals/79/0c/3a/790c3acea7194637782fcc808e2ff9dc.gif"
};

export const HOURLY_MANA_REGEN = [ 5, 10, 15, 20 ];
