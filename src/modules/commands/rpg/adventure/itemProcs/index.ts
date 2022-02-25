import { OverallStatsProps } from "@customTypes";
import { BattleStats } from "@customTypes/adventure";
import { ItemProcMapProps } from "@customTypes/battle";
import { CharacterStatProps } from "@customTypes/characters";
import { ItemProps } from "@customTypes/items/index";
import { clone } from "utility";
import * as damageItems from "./categories/damage";
import * as defenseItems from "./categories/defense";
import * as lifestealItems from "./categories/lifesteal";
import * as intellegenceItems from "./categories/intellegence";

const ItemProcMap: ItemProcMapProps = {
	"duskblade of draktharr": damageItems.duskbladeOfDraktharr,
	"youmuu's ghostblade": damageItems.youmuusGhostblade,
	"navori quickblades": damageItems.navoriQuickblades,
	"black cleaver": defenseItems.blackCleaver,
	bloodthirster: lifestealItems.bloodthirster,
	desolator: damageItems.desolator,
	"kraken slayer": damageItems.krakenSlayer,
	"guardian angel": defenseItems.guardianAngel,
	thornmail: defenseItems.thornmail,
	stormrazor: damageItems.stormrazor,
	"sapphire's staff": intellegenceItems.sapphiresStaff,
	"seeker's armguard": intellegenceItems.seekersArmguard,
	"lunar wand": intellegenceItems.lunarWand,
	"staff of medana": intellegenceItems.staffOfMedana,
	"farsight orb": intellegenceItems.farsightOrb,
};

export default ItemProcMap;

type I = ItemProps["stats"];
type S = BattleStats["totalStats"];
export const processItemStats = (stats: OverallStatsProps, itemStats: I) => {
	const clonedStats = clone(stats);
	if (!clonedStats.originalHp) {
		throw new Error("Unprocessable originalHp");
	}
	Object.keys(itemStats).forEach((key) => {
		if (key === "strength") {
			clonedStats.strength = clonedStats.strength + itemStats.strength;
			clonedStats.originalHp =
        (clonedStats.originalHp || clonedStats.strength) + itemStats.strength;
		} else {
			clonedStats[key as keyof OverallStatsProps] =
        (clonedStats[key as keyof OverallStatsProps] || 0) +
        clonedStats[key as keyof CharacterStatProps];
		}
	});

	return clonedStats as S;
};
