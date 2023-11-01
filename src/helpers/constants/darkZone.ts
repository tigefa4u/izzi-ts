import { CharacterStatProps } from "@customTypes/characters";

export const DZ_STARTER_CARD_STATS: CharacterStatProps = {
	vitality: 60,
	defense: 60,
	dexterity: 60,
	intelligence: 60,
	strength: 60,
	critical: 1,
	evasion: 1,
	accuracy: 1,
	precision: 1,
};

export const MIN_LEVEL_FOR_DZ_TRADE = 3;

export const MAX_FRAGMENT_TRANSFER = 99999999;

export const DZ_STARTER_INVENTORY_SLOTS = 3;
export const DZ_INVENTORY_SLOTS_PER_LEVEL = 2;

export const DZ_CARD_COST = 800000;
export const DZ_FRAGMENT_COST_PER_EVO = 10000;
export const DZ_FRAGMENT_COST_PER_STAT_POINT = 1000;
export const DZ_MAX_STAT = 100;

export const PERMIT_PER_ADVENTURE = 1;

// For enchantment
export const XP_PER_FRAGMENT = 200;

export const statNames = [
	{
		name: "ATK",
		key: "vitality",
	},
	{
		name: "HP",
		key: "strength",
	},
	{
		name: "DEF",
		key: "defense",
	},
	{
		name: "SPD",
		key: "dexterity",
	},
	{
		name: "ARM",
		key: "intelligence",
	},
];
