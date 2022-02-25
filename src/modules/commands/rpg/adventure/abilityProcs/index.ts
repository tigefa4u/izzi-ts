import { AbilityProcMapProps } from "@customTypes/battle";
import * as passiveAbilities from "./passives";
import * as activeAbilities from "./actives";

const AbilityProcMap: AbilityProcMapProps = {
	wrecker: passiveAbilities.wrecker,
	surge: passiveAbilities.surge,
	chronobreak: passiveAbilities.chronobreak,
	"dream eater": passiveAbilities.dreamEater,
	"fighting spirit": passiveAbilities.fightingSpirit,
	berserk: passiveAbilities.berserk,
	"balancing strike": passiveAbilities.balancingStrike,
	evasion: activeAbilities.evasion,
	misdirection: activeAbilities.misdirection,
	restriction: activeAbilities.restriction,
	"dragon rage": activeAbilities.dragonRage,
	tornado: activeAbilities.tornado,
	"spell book": activeAbilities.spellBook,
	sleep: activeAbilities.sleep,
	"bone platting": activeAbilities.bonePlating,
	blizzard: activeAbilities.blizzard,
	revitalize: activeAbilities.revitalize,
	"rapid fire": activeAbilities.rapidFire,
	crusher: activeAbilities.crusher,
	"presence of mind": activeAbilities.presenceOfMind,
	precision: activeAbilities.precision,
	electrocute: activeAbilities.electrocute,
	"elemental strike": activeAbilities.elementalStrike,
	predator: activeAbilities.predator,
	"time bomb": activeAbilities.timeBomb,
	"toxic screen": activeAbilities.toxicScreen,
	eclipse: activeAbilities.eclipse,
	"future sight": activeAbilities.futureSight,
	"killer instincts": activeAbilities.killerInstincts,
	guardian: activeAbilities.guardian,
	lifesteal: activeAbilities.lifesteal,
	"point blank": activeAbilities.pointBlank,
	exhaust: activeAbilities.exhaust,
	frost: activeAbilities.frost,
	dominator: activeAbilities.dominator
};

export default AbilityProcMap;