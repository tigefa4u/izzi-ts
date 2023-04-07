import { MapProps } from "@customTypes";
import emoji from "./emoji";

const emojis: MapProps = {
	"elemental strike": emoji.elementalstrike,
	fast: emoji.fast,
	chronobreak: emoji.chronobreak,
	confusion: emoji.confusion,
	"toxic screen": emoji.toxic,
	"dragon rage": emoji.dragonrage,
	neutral: emoji.neutral,
	"rapid fire": emoji.rapidfire,
	desolator: emoji.desolator,
	"youmuu's ghostblade": emoji.ghostblade,
	bloodthirster: emoji.bloodthirster,
	"navori quickblades": emoji.navoriquickblades,
	stormrazor: emoji.stormrazor,
	"black cleaver": emoji.blackcleaver,
	"duskblade of draktharr": emoji.duskblade,
	thornmail: emoji.thornmail,
	"harbinger of death": emoji.harbingerofdeath,
	light: emoji.light,
	dark: emoji.dark,
	poison: emoji.poison,
	water: emoji.water,
	wind: emoji.wind,
	grass: emoji.grass,
	electric: emoji.electric,
	crystal: emoji.crystal,
	fire: emoji.fire,
	fighter: emoji.fighter,
	ground: emoji.ground,
	revitalize: emoji.heal,
	lifesteal: emoji.lifesteal,
	"presence of mind": emoji.presenceofmind,
	berserk: emoji.berserk,
	"balancing strike": emoji.balancingstrike,
	"point blank": emoji.pointblank,
	predator: emoji.predator,
	frost: emoji.frost,
	crusher: emoji.shatteredsword,
	dominator: emoji.dominator,
	electrocute: emoji.electrocute,
	exhaust: emoji.exhaust,
	"bone plating": emoji.boneplatting,
	surge: emoji.bloodsurge,
	blizzard: emoji.blizzard,
	explode: emoji.explode,
	restriction: emoji.restriction,
	guardian: emoji.guardian,
	"spell book": emoji.spellbook,
	"time bomb": emoji.timebomb,
	wrecker: emoji.wrecker,
	sleep: emoji.sleep,
	misdirection: emoji.misdirection,
	tornado: emoji.tornado,
	evasion: emoji.evasion,
	precision: emoji.precision,
	"kraken slayer": emoji.krakenslayer,
	"guardian angel": emoji.guardianangel,
	souls: emoji.soul,
	"dark seal": emoji.darkseal,
	"health potion": emoji.healthpotion,
	"corrupting potion": emoji.corruptingpotion,
	"immortal shieldbow": emoji.immortalshieldbow,
	izzipoints: emoji.izzipoints,
	premium: emoji.premium,
	shard: emoji.shard,
	"killer instincts": emoji.killerinstincts,
	eclipse: emoji.eclipse,
	"future sight": emoji.futuresight,
	"seeker's armguard": emoji.seekersarmguard,
	"farsight orb": emoji.farsightorb,
	"sapphire's staff": emoji.sapphirestaff,
	"fighting spirit": emoji.fightingspirit,
	division1: emoji.division1,
	division2: emoji.division2,
	division3: emoji.division3,
	zeke: emoji.zeke,
	hero: emoji.hero,
	ranger: emoji.ranger,
	duke: emoji.duke,
	"grand master": emoji.grandmaster,
	"grand master1": emoji.grandmaster1,
	"grand master2": emoji.grandmaster2,
	"grand master3": emoji.grandmaster3,
	blueorb: emoji.blueorb,
	skull: emoji.skull,
	feather: emoji.feather,
	rpg: emoji.rpg,
	shield: emoji.shield,
	gem: emoji.gem,
	"dream eater": emoji.dreameater,
	"lunar wand": emoji.lunarwand,
	"staff of medana": emoji.staffofmedana,
	"renewal taekwondo": emoji.renewaltaekwondo,
	permit: emoji.permit,
	gold: emoji.gold,
	"defensive strike": emoji.defensiveStrike,
	"last stand": emoji.lastStand,
	"agnus scepter": emoji.agnusScepter,
	"skull basher": emoji.skullBasher,
	"vampire's blade": emoji.vampiresBlade,
	leer: emoji.leer,
	"lightning shield": emoji.lightningShield,
};

export const emojiMap: (key?: string) => string = (key) => {
	if (!key) return "";
	return emojis[key];
};