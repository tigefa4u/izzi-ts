import { ReactionsProps } from "@customTypes";
import { QuestTypes } from "@customTypes/quests";
import { PermissionString } from "discord.js";
import emoji from "emojis/emoji";
import { ElementTypeColorProps } from "./helperTypes";
import { ranksMeta } from "./rankConstants";

export const BASE_XP = 10;

export const XP_GAIN_EXPONENT = 1.5;

export const DOT = "•";
export const STAR = "★";
export const BASE_RANK = ranksMeta.silver.name;
export const STARTER_CARD_RANK = ranksMeta.legend.name;
export const STARTER_CARD_RANK_ID = 5;
export const STARTER_CARD_LEVEL = 20;
export const STARTER_CARD_EXP = 1;
export const STARTER_CARD_R_EXP = Math.floor(
	BASE_XP * STARTER_CARD_LEVEL ** XP_GAIN_EXPONENT
);
export const STARTER_GOLD = 0;
export const DEFAULT_ERROR_TITLE = "Error :no_entry:";
export const DEFAULT_SUCCESS_TITLE = `Success ${emoji.celebration}`;
export const DEFAULT_QUEST_COMPLETE_TITLE = `Quest Completed ${emoji.celebration}`;

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
	loss: "https://i.pinimg.com/originals/79/0c/3a/790c3acea7194637782fcc808e2ff9dc.gif",
};

export const HOURLY_MANA_REGEN = [ 5, 10, 15, 20 ];

export const REACTIONS: ReactionsProps = {
	next: {
		emoji: "➡️",
		label: "next",
	},
	previous: {
		emoji: "⬅️",
		label: "previous",
	},
	bin: {
		emoji: "🗑️",
		label: "bin",
		style: "DANGER",
	},
	confirm: {
		emoji: "✅",
		label: "confirm",
		style: "SUCCESS",
	},
	cancel: {
		emoji: "❌",
		label: "cancel",
		style: "DANGER",
	},
};
export const REACTIONS_DEFAULT_STYLE = "PRIMARY";

export const LOTTERY_PRICE = 1000;
export const LEVEL_UP_MANA_GAIN = 2;
export const LEVEL_UP_EXP_MULTIPLIER = 47;
export const GOLD_LIMIT = 100000000;
export const BET_LIMIT = 500000;
export const DEFAULT_PACK = {
	num: 1000,
	cost: 1350,
	cardPerPage: 10,
	rank: ranksMeta.platinum.name,
	rank_id: ranksMeta.platinum.rank_id,
};

export const PAGE_FILTER = {
	currentPage: 1,
	perPage: 10,
};

export const ORB_INTEREST_RATE = 0.7;

// Market commission is used to allow the user to spawn
// a raid boss of his choice when they reach 1m in tax.
// This gold is also given back to the community in the form of
// raid bonus gold.
export const MARKET_COMMISSION = 0.06;
export const RAID_TREASURY_PERCENT = 0.3;
export const TAXPAYER_RETURN_PERCENT = 0.7;
export const BASE_ORBS_COUNT = 20;
export const MARRIAGE_BONUS = 2000;
export const INPUT_CHARACTERS_MAX_COUNT = 20;
export const GUILD_CREATION_COST = 200000;
export const MARKET_PRICE_CAP = 100000000;
export const MIN_MARKET_PRICE = 2000;
export const TAX_PAYER_RAID_PITY_THRESHOLD = 1000000; // Tax amount
// export const GUILD_BASE_STATS = {
// vitality: 0.25,
// defense: 0.31,
// dexterity: 0.32,
// intelligence: 0.25,
// strength: 0.45,
// itemstats: {}
// };

export const GUILD_BASE_STATS = {
	vitality: 5,
	defense: 5,
	dexterity: 5,
	intelligence: 5,
	strength: 5,
	// itemstats: {}
};

export const RDT_ADMIN_PERMISSION = "ADMINISTRATOR";

export const GUILD_MARKET_IDS = [ 2, 5, 3 ];
export const GUILD_MAX_DONATION = 100000000;
export const GUILD_MAX_LEVEL = 150;
export const GUILD_MIN_LEVEL_FOR_ITEM_BONUS = 100;
export const SOUL_ID = 2;
export const SEAL_ID = 5;
export const IMMORTAL_SHIELDBOW_ID = 3;
export const GUILD_ITEM_PROPERTIES = {
	SOUL_ID: "souls",
	SEAL_ID: "seals",
	IMMORTAL_SHIELD_BOW_ID: "immortalshieldbow",
};

export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	year: "2-digit",
	month: "short",
	day: "numeric",
};

export const MANA_PER_BATTLE = 5;
export const DUNGEON_MANA_PER_BATTLE = 15;
export const DUNGEON_MID_USER_LEVEL = 25;
export const DUNGEON_MID_USER_RANK_ID = 3;

export const CANVAS_DEFAULTS = {
	width: 708,
	height: 630,
	cardWidth: 473,
	cardHeight: 630,
	iconWidth: 64,
	iconHeight: 64,
};

export const EMBED_DEFAULT_COLOR = 13148872;

export const BATTLE_ROUNDS_COUNT = 16;
export const RAGE_MODE_ROUND = 11;

export const REQUIRED_TRADE_LEVEL = 8;

export const MAX_TEAMS_ALLOWED = 5;

export const SPBT_REQUIRED_MANA = 2;

export const MAX_RAID_LOBBY_MEMBERS = 5;
export const PERMIT_PER_RAID = 2;
export const MAX_ENERGY_PER_RAID = 25;
export const ENERGY_PER_ATTACK = 10;
export const HOURS_PER_RAID = 4;

export const DUNGEON_DEFAULTS = {
	r_exp: 50,
	exp: 0,
	wins: 0,
	loss: 0,
	division: 1,
	rank_id: 1,
	rank: "duke",
	numberOfDivisions: 3,
	numberOfRanks: 5,
};

export const BATTLES_PER_CHANNEL = 2;
export const BATTLE_FORFEIT_RETRIES = 1;

export const USER_XP_GAIN_PER_BATTLE = 8;

export const MAX_GOLD_IN_TRADE = 100000000;
export const MAX_CARDS_IN_TRADE = 10000;

export const SACRIFICE_GOLD_COST = 1350;

export const ENCHANTMENT_ALLOWED_RANKS = [
	ranksMeta.silver.name,
	ranksMeta.gold.name,
	ranksMeta.platinum.name,
];

export const MARKET_PURCHASE_LIMIT = 5;

export const MAX_CHOSEN_SKINS_ALLOWED = 50;

export const MIN_RAID_USER_LEVEL = 5;
export const MIN_LEVEL_FOR_HIGH_RAIDS = 22;
export const IMMORTAL_RAIDS = [ "i", "immortal" ];
export const HIGH_LEVEL_RAIDS = [ "h", "i", "hard", "immortal" ];

export const BOT_GLOBAL_PERMISSIONS: PermissionString[] = [
	"ADD_REACTIONS",
	"ATTACH_FILES",
	"EMBED_LINKS",
	"SEND_MESSAGES",
	"READ_MESSAGE_HISTORY",
	"USE_APPLICATION_COMMANDS",
];

export const THREAD_CHANNEL_PERMISSIONS = [ "SEND_MESSAGES_IN_THREADS" ];

export const MAX_REQUESTS_PER_CHANNEL = 6;

export const MAX_GUILD_ITEMS_PURCHASABLE = 500;
export const MAX_GUILD_REPUTATION_POINTS = 10;

export const HIDE_VISUAL_BATTLE_ARG = "hidebt";

export const DUNGEON_MAX_MANA = 100;
export const DUNGEON_MIN_LEVEL = 10;

export const BATTLE_TYPES = {
	DUNGEON: "DUNGEON",
	FLOOR: "FLOOR",
};

export const HARBINGER_OF_DEATH_PROC_ROUND = 3;
export const MINIMUM_LEVEL_FOR_REPUTATION = 15;

export const MAX_USER_STATUS_LENGTH = 80;

export const MAX_CARD_NICKNAME_LENGTH = 80;

export const RAID_PING_NAME = "raid ping [bot]";

export const GUILD_STATUS_MAX_LENGTH = 350;

export const MAX_GOLD_THRESHOLD = 999999999;

export const CHARACTER_LEVEL_EXTENDABLE_LIMIT = 10;

export const DEFAULT_STARTER_GUIDE_TITLE = "Starter Guide";

export const MAX_CONSUMABLE_SOULS = 700;

export const MAX_ABSORBABLE_SOULS = 100;
export const ABILITY_BUFF_MAX_PERCENT = 195;
export const ABILITY_DEBUFF_MAX_PERCENT = 15;

export const CONSOLE_BUTTONS = {
	VOTE: {
		id: "vote",
		label: "Vote",
	},
	FLOOR_BT: {
		id: "floor_bt",
		label: "Floor Battle",
	},
	FLOOR_BT_ALL: {
		id: "floor_bt_all",
		label: "Bt all",
	},
	NEXT_FLOOR: {
		id: "next_floor",
		label: "Next Floor",
	},
	NEXT_ZONE: {
		id: "next_zone",
		label: "Next Arena",
	},
	RAID_BATTLE: {
		id: "raid_bt",
		label: "Rd bt",
	},
	RAID_SPAWN: {
		id: "raid_spawn",
		label: "Raid spawn",
	},
	CONSOLE: {
		id: "console",
		label: "Console",
	},
	RAID_COMMANDS: {
		id: "raid_commands",
		label: "Rd Commands",
	},
	RAID_MAKE_PRIVATE: {
		id: "raid_make_private",
		label: "Rd Private",
	},
	RAID_MAKE_PUBLIC: {
		id: "raid_make_public",
		label: "Rd Public",
	},
	RAID_VIEW: {
		id: "raid_view",
		label: "Rd View",
	},
	RAID_START: {
		id: "raid_start",
		label: "Rd Start",
	},
	RAID_JOIN: {
		id: "raid_join",
		label: "Rd Join",
	},
	HOURLY: {
		id: "hourly",
		label: "Hourly",
	},
	LOTTERY: {
		id: "lotto",
		label: "Lottery",
	},
	RAID_LEAVE: {
		id: "raid_leave",
		label: "Rd Leave",
	},
	RAID_RECRUIT: {
		id: "raid_recruit",
		label: "Rd Recruit",
	},
	HELP: {
		id: "help",
		label: "Help",
	},
	BACK: {
		id: "back",
		label: "Back",
	},
	JUMP_TO_FLOOR: {
		id: "jump_to_floor",
		label: "Jump to Floor",
	},
	UPGRADE_CARD_LEVEL: {
		id: "upgrade_card_level",
		label: "Upgrade Level",
	},
	EVOLVE_CARD: {
		id: "evolve_card",
		label: "Evolve Card",
	},
	RAID_PARTY: {
		id: "raid_party",
		label: "Rd Party",
	},
	SELECT_CARD: {
		id: "select_card",
		label: "Select Card",
	},
	GUIDE: {
		id: "guide",
		label: "Beginner Guide",
	},
	CHANGE_LOGS: {
		id: "change_log",
		label: "Change Logs",
	},
	FORFEIT: {
		id: "forfeit",
		label: "Forfeit",
	},
	FINISH_BATTLE: {
		id: "finish_battle",
		label: "Finish Battle",
	},
	VIEW_BATTLE_LOGS: {
		id: "view_battle_logs",
		label: "View Battle Logs",
	},
	JOIN_SUPPORT_SERVER: {
		id: "join_support_server",
		label: "Join Support Server",
	},
	START_JOURNEY: {
		id: "start_journey",
		label: "Start Journey",
	},
	REFERRAL: {
		id: "referral",
		label: "Refer your friends and get a free card!",
	},
	UPGRADE_GUILD: {
		id: "upgrade_guild",
		label: "Upgrade Guild",
	},
	ATTACK_WORLDBOSS: {
		id: "attack_worldboss",
		label: "Battle World Boss",
	},
	DISCLAIMER: {
		id: "disclaimer",
		label: "Show Disclaimer & Rules",
	},
	INFO_INVENTORY_CARD: {
		id: "info_inventory_card",
		label: "View Info",
	},
	VIEW_INVENTORY: {
		id: "view_inventory",
		label: "View Inventory",
	},
};

export const ELEMENTAL_ADVANTAGES = {
	DEFAULT: {
		p1: 1.1,
		p2: 0.98,
	},
	EFFECTIVE: {
		p1: 1.2,
		p2: 0.94,
	},
	SUPER_EFFECTIVE: {
		p1: 1.3,
		p2: 0.9,
	},
	NEUTRAL: {
		p1: 1,
		p2: 1,
	},
};

export const ALLOWED_CONSUME_CARDS_TO_SHARDS = [
	ranksMeta["legend"].rank_id,
	ranksMeta["divine"].rank_id,
];

export const SHARDS_PER_CARD: { [key: string]: number } = {
	legend: 1,
	divine: 2,
};

export const MAX_REFERRAL_REWARD_POINTS = 20;

export const MAX_MANA_GAIN = 420;
// max level for this mana is 187

export const REFERRAL_BG_IMG_URL =
  "https://assets.izzi-xenex.xyz/assets/v3/izzi-referral.jpeg";
export const MIN_LEVEL_FOR_REFERRAL = 6;

// Ability cap in %
export const ABILITY_CAP = { fightingSpirit: { vitality: 150 } };

export const MAX_ADMINS_PER_GUILD = 6;

export const UNLOCK_EXTRA_GUILD_ADMIN_AT_NTH_LEVEL = 20;

export const LOGGER_CONTEXT = "logger_context";

export const COMMANDS_WITH_RAW_ARGS = [ "guild", "team", "dungeon" ];

// Need to move this to DB
export const BANNED_TERMS = [ "kkk", "ngga", "nigger", "nbba", "pussy", "porn" ];

export const QUEST_TYPES: {
  [key in QuestTypes]: QuestTypes;
} = {
	RAID_CHALLENGE: "RAID_CHALLENGE",
	RAID_CARRY: "RAID_CARRY",
	CARD_LEVELING: "CARD_LEVELING",
	WEBPAGES: "WEBPAGES",
	TRADING: "TRADING",
	MARKET: "MARKET",
	DUNGEON: "DUNGEON",
	PVP: "PVP",
	WORLD_BOSS: "WORLD_BOSS",
};

export const MIN_TRADE_CARDS_FOR_QUEST = 1000;

export const WORLD_BOSS_DIFFICULTY = "hard";
export const WORLD_BOSS_LEVEL = 2000;
// Number of iterations before the raid boss is defeated
export const WORLD_BOSS_ENERGY = 100;
export const WORLD_BOSS_HP_MULTIPLIER = 40; // reaching for 200m hp
export const WORLD_BOSS_EXPIRES_IN_DAYS = 14;
export const WORLD_BOSS_MANA_PER_BATTLE = 50;
export const WORLD_BOSS_MIN_LEVEL = 50;

export const WORLD_BOSS_MARKET_CARD_RANK = ranksMeta.immortal.name;
export const WORLD_BOSS_MARKET_CARD_RANK_ID = ranksMeta.immortal.rank_id;

export const AGNUS_SCEPTER_MAX_HP_GAIN = 2000;
export const AGNUS_SCEPTER_DEFAULT_HP_GAIN = 1350;

export const MARKET_LOG_MIN_COLLECTION_ID_DIGITS = 7;

export const TEAM_POINTS_PER_TASK = 1;

export const DONATOR_PERKS_MESSAGE =
  "\n\n**__Donator Perks__**\n$15+ - **Donator Role**\n$100+ - **Ascended Role**" +
  "\n$500+ - **Exclusive Role**" +
  "\n$1000+ **Ultimate 1k Role and 1 Xenex card of your choice (Izzi / Hoax / Yue)**" +
  "\n$2000+ **Insane Role and 1 Xenex card of your choice (Izzi / Hoax)**" +
  "\n**__Hyper Supporter perks:__ Claim 1 Xenex card for every $1000 donation milestone upto 3 cards.**" +
  "\n**DM HoaX#3368 (266457718942990337) to claim your Perks.**";

export const OS_GLOBAL_MARKET_CHANNEL = "1136920564079022090";

/**
 * DPR - visual representation of INT
 * energy bar.
 * INT is basically armor
 */
export const DEFAULT_DPR = 1;
export const DPR_MAX_BUFF = 1;
export const DEFAULT_DPR_GAIN = 0.1;
export const DEFAULT_DPR_LOSS = 0.03;
export const DPR_GAIN_ON_EVADE = 0.02;

export const FODDER_RANKS = [
	ranksMeta.silver.name,
	ranksMeta.gold.name,
	ranksMeta.platinum.name,
]; // D3 ranks
export const D2_RANKS = [
	ranksMeta.diamond.name,
	ranksMeta.divine.name,
	ranksMeta.legend.name,
];
export const D1_RANKS = [
	ranksMeta.immortal.name,
	ranksMeta.exclusive.name,
	ranksMeta.ultimate.name,
	// ranksMeta.mythical.name,
];

export const tutorialLinks = [
	"https://izzi-xenex.xyz/blogs/raids-beginner-guide",
	"https://izzi-xenex.xyz/blogs/beginner-battle-and-leveling-guide",
	"https://izzi-xenex.xyz/blogs/card-trading-guide",
	"https://izzi-xenex.xyz/blogs/teams-and-abilities-beginner-guide",
	"https://izzi-xenex.xyz/blogs/command-filter-library",
];

export const PVP_XP = {
	WIN: 4,
	LOSS: 4,
	MMR_GAIN: 1,
	MMR_LOSS: 1,
};

export const LOW_LEVEL_THRESHOLD = 25;

export const RAID_CAP_PERCENT: { [key: string]: number } = {
	easy: 10,
	medium: 7,
	hard: 6,
	immortal: 5,
};
