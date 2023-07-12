import { CommandMapProps } from "@customTypes/command";
import {
	bonk, lick, pat, poke, spank, cuddle, slap, bite, kill, kiss, slowKiss, tightHug, punch, hug, sex 
} from "modules/commands/basic/actions";
import { status } from "modules/commands/basic/botStatus";
import {
	cry, dance, run, dodge, baka, pout, glare, laugh 
} from "modules/commands/basic/emotions";
import { bet } from "modules/commands/basic/gamble";
import { help, invite, ping, websiteUrls } from "modules/commands/basic/index";
import { daily, donate, server } from "modules/commands/basic/info.";
import { ability } from "modules/commands/rpg/abilities";
import { startBattle } from "modules/commands/rpg/adventure";
import { cinfo } from "modules/commands/rpg/cardinfo";
import { redirect } from "modules/commands/rpg/cardSpawn/redirect";
import { cardCollection } from "modules/commands/rpg/collections";
import { favorite } from "modules/commands/rpg/collections/favorite";
import { getCardInfo } from "modules/commands/rpg/collections/info";
import { nickname } from "modules/commands/rpg/collections/nickname";
import { selectCard } from "modules/commands/rpg/collections/select";
import { compareCards } from "modules/commands/rpg/compare";
import { cards } from "modules/commands/rpg/consumableCards";
import { consume } from "modules/commands/rpg/consumeOrbsToShards";
import { crate } from "modules/commands/rpg/crates";
import { enchantCard } from "modules/commands/rpg/enchantment";
import { evolveCard } from "modules/commands/rpg/evolution";
import { upgradeCard } from "modules/commands/rpg/evolution/upgradeCard";
import { guild } from "modules/commands/rpg/guild";
import { guildEvents } from "modules/commands/rpg/guildEvents";
import { itemCollection, itemInfo } from "modules/commands/rpg/items";
import { itemshop } from "modules/commands/rpg/items/shop";
import { equip, unEquip } from "modules/commands/rpg/items/useItems";
import { leaderboard } from "modules/commands/rpg/leaderboard";
import { market } from "modules/commands/rpg/market";
import { divorce, propose } from "modules/commands/rpg/marriage";
import { lottery } from "modules/commands/rpg/misc";
import { packs } from "modules/commands/rpg/packs";
import { premium } from "modules/commands/rpg/premium";
import { profile } from "modules/commands/rpg/profile";
import {
	mana, exp, level, gold, shards, points, orbs, permits, deleteAccount 
} from "modules/commands/rpg/profile/profileInfo";
import { start } from "modules/commands/rpg/profile/startJourney";
import { updateIzziProfile } from "modules/commands/rpg/profile/update";
import { raidActions } from "modules/commands/rpg/raids";
import { eventActions } from "modules/commands/rpg/raids/events";
import { give, hourly } from "modules/commands/rpg/resource";
import { sacrificeCard } from "modules/commands/rpg/sacrifice";
import { skins } from "modules/commands/rpg/skins";
import { wishlist } from "modules/commands/rpg/wishlist";
import { team } from "modules/commands/rpg/team";
import { trade } from "modules/commands/rpg/trades";
import { dex } from "modules/commands/rpg/xendex";
import { floor } from "modules/commands/rpg/zoneAndFloor/floor";
import { zone } from "modules/commands/rpg/zoneAndFloor/zone";
import { makeAWish } from "modules/commands/rpg/specialCommands/makeAWish";
import { starterGuide } from "modules/commands/rpg/profile/guide";
import { console } from "modules/commands/rpg/console";
import { viewChangeLogs } from "modules/commands/basic/changelogs";
import { userReferrals } from "modules/commands/basic/referrals";
import { customCard } from "modules/commands/rpg/profile/customCard";
import { dungeonFunc } from "modules/commands/rpg/dungeon/v2";
import { quests } from "modules/commands/rpg/quests";
import { worldBossCommands } from "modules/commands/rpg/worldBoss";
import { tourneyCommands } from "modules/commands/rpg/tournament";

const commandMap: CommandMapProps = {
	ping: ping,
	invite: invite,
	cinfo: cinfo,
	help: help,
	bet: bet,
	profile: profile,
	start: start,
	mana: mana,
	points: points,
	gold: gold,
	shards: shards,
	exp: exp,
	level: level,
	orbs: orbs,
	permits: permits,
	hourly: hourly,
	daily: daily,
	server: server,
	premium: premium,
	donate: donate,
	dex: dex,
	items: itemCollection,
	ability: ability,
	iteminfo: itemInfo,
	lottery: lottery,
	give: give,
	floor: floor,
	zone: zone,
	packs: packs,
	compare: compareCards,
	cards: cards,
	status: status,
	skins: skins,
	itemshop: itemshop,
	market: market,
	redirect: redirect,
	consume: consume,
	leaderboard: leaderboard,
	divorce: divorce,
	propose: propose,
	crate: crate,
	guild: guild,
	collection: cardCollection,
	info: getCardInfo,
	select: selectCard,
	equip: equip,
	unequip: unEquip,
	favorite: favorite,
	battle: startBattle,
	trade: trade,
	sacrifice: sacrificeCard,
	evolution: evolveCard,
	team: team,
	update: updateIzziProfile,
	raid: raidActions,
	event: eventActions,
	dungeon: dungeonFunc,
	enchantment: enchantCard,
	bonk: bonk,
	cry: cry,
	poke: poke,
	spank: spank,
	lick: lick,
	pat: pat,
	cuddle: cuddle,
	slap: slap,
	bite: bite,
	kill: kill,
	kiss: kiss,
	"slow-kiss": slowKiss,
	"tight-hug": tightHug,
	sex: sex,
	punch,
	hug,
	dance: dance,
	dodge: dodge,
	run: run,
	baka: baka,
	pout: pout,
	glare: glare,
	laugh: laugh,
	website: websiteUrls,
	delete: deleteAccount,
	nickname: nickname,
	"guild event": guildEvents,
	"upgrade-card": upgradeCard,
	wishlist: wishlist,
	"make a wish": makeAWish,
	guide: starterGuide,
	console: console,
	changelogs: viewChangeLogs,
	referral: userReferrals,
	customcard: customCard,
	quest: quests,
	worldboss: worldBossCommands,
	tournament: tourneyCommands
	// spbt: spbt, // temporarily removed
	// sort: sort, // removed
};

export default commandMap;