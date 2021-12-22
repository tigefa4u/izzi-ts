import { CommandMapProps } from "@customTypes/command";
import { bet } from "modules/commands/basic/gamble";
import { help, invite, ping } from "modules/commands/basic/index";
import { daily, donate, server } from "modules/commands/basic/info.";
import { cinfo } from "modules/commands/rpg/cardinfo";
import { collection } from "modules/commands/rpg/inventory";
import { premium } from "modules/commands/rpg/premium";
import { profile } from "modules/commands/rpg/profile";
import {
	mana, exp, level, gold, shards, points, orbs, permits 
} from "modules/commands/rpg/profile/profileInfo";
import { start } from "modules/commands/rpg/profile/startJourney";
import { hourly } from "modules/commands/rpg/resource";
import { dex } from "modules/commands/rpg/xendex";

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
	dex: dex
};

export default commandMap;