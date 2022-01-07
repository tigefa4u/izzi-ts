import { CommandMapProps } from "@customTypes/command";
import { status } from "modules/commands/basic/botStatus";
import { bet } from "modules/commands/basic/gamble";
import { help, invite, ping } from "modules/commands/basic/index";
import { daily, donate, server } from "modules/commands/basic/info.";
import { ability } from "modules/commands/rpg/abilities";
import { cinfo } from "modules/commands/rpg/cardinfo";
import { compare } from "modules/commands/rpg/compare";
import { cards } from "modules/commands/rpg/consumableCards";
import { collection } from "modules/commands/rpg/inventory";
import { itemCollection, itemInfo } from "modules/commands/rpg/items";
import { itemshop } from "modules/commands/rpg/items/shop";
import { lottery } from "modules/commands/rpg/misc";
import { packs } from "modules/commands/rpg/packs";
import { premium } from "modules/commands/rpg/premium";
import { profile } from "modules/commands/rpg/profile";
import {
	mana, exp, level, gold, shards, points, orbs, permits 
} from "modules/commands/rpg/profile/profileInfo";
import { start } from "modules/commands/rpg/profile/startJourney";
import { give, hourly } from "modules/commands/rpg/resource";
import { skins } from "modules/commands/rpg/skins";
import { sort } from "modules/commands/rpg/sorting";
import { dex } from "modules/commands/rpg/xendex";
import { floor } from "modules/commands/rpg/zoneAndFloor/floor";
import { zone } from "modules/commands/rpg/zoneAndFloor/zone";

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
	collection: collection,
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
	sort: sort,
	compare: compare,
	cards: cards,
	status: status,
	skins: skins,
	itemshop: itemshop
};

export default commandMap;