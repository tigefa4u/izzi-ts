import { OverallStatsProps } from "@customTypes";
import { BattleStats } from "@customTypes/adventure";
import { ItemProcMapProps } from "@customTypes/battle";
import { CharacterStatProps } from "@customTypes/characters";
import { ItemProps } from "@customTypes/items/index";
import { clone } from "utility";
import * as damageItems from "./categories/damage";
import * as defenseItems from "./categories/defense";
import * as lifestealItems from "./categories/lifesteal";
import * as intelligenceItems from "./categories/intelligence";

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
	"sapphire's staff": intelligenceItems.sapphiresStaff,
	"seeker's armguard": intelligenceItems.seekersArmguard,
	"lunar wand": intelligenceItems.lunarWand,
	"staff of medana": intelligenceItems.staffOfMedana,
	"farsight orb": intelligenceItems.farsightOrb,
	"skull basher": damageItems.skullBasher,
	"agnus scepter": intelligenceItems.agnusScepter,
	"vampire's blade": lifestealItems.vampiresBlade
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
        itemStats[key as keyof CharacterStatProps] || 0;
		}
	});

	return clonedStats as S;
};
