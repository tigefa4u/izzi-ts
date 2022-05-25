import { ReactionsProps, XPGainPerRankProps } from "@customTypes";
import { PermissionResolvable, PermissionString } from "discord.js";
import emoji from "emojis/emoji";
import { ElementTypeColorProps, RanksMetaProps } from "./helperTypes";

export const BASE_XP = 10;

export const XP_GAIN_EXPONENT = 1.5;

export const BASE_RANK = "silver";
export const STARTER_CARD_RANK = "diamond";
export const STARTER_CARD_RANK_ID = 4;
export const STARTER_CARD_LEVEL = 20;
export const STARTER_CARD_EXP = 1;
export const STARTER_CARD_R_EXP = Math.floor(
	BASE_XP * STARTER_CARD_LEVEL ** XP_GAIN_EXPONENT
);
export const STARTER_GOLD = 0;
export const DEFAULT_ERROR_TITLE = "Error :no_entry:";
export const DEFAULT_SUCCESS_TITLE = `Success ${emoji.celebration}`;

export const ranksMeta: RanksMetaProps = {
	silver: {
		size: 1,
		rank_id: 1,
		color: "#b6c7be",
	},
	gold: {
		size: 2,
		rank_id: 2,
		color: "#c89e50",
	},
	platinum: {
		size: 3,
		rank_id: 3,
		color: "#298077",
	},
	diamond: {
		size: 4,
		rank_id: 4,
		color: "#73c0d3",
	},
	legend: {
		size: 5,
		rank_id: 5,
		color: "#c11b17",
	},
	divine: {
		size: 6,
		rank_id: 6,
		color: "#c35817",
	},
	immortal: {
		size: 7,
		rank_id: 7,
		color: "#b641c4",
	},
	exclusive: {
		size: 8,
		rank_id: 8,
	},
	ultimate: {
		size: 9,
		rank_id: 9,
	},
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
export const GOLD_LIMIT = 5000000;
export const BET_LIMIT = 50000;
export const DEFAULT_PACK = {
	num: 50,
	cost: 1800,
	cardPerPage: 10,
	rank: "platinum",
	rank_id: 3,
};

export const PAGE_FILTER = {
	currentPage: 1,
	perPage: 10,
};

export const XP_GAIN_PER_RANK: XPGainPerRankProps = {
	silver: 100,
	gold: 150,
	platinum: 200,
	diamond: 250,
	legend: 300,
	divine: 450,
	immortal: 500,
	exclusive: 800,
	ultimate: 800,
};

export const ORB_INTEREST_RATE = 0.7;
export const MARKET_COMMISSION = 0.08;
export const BASE_ORBS_COUNT = 20;
export const MARRIAGE_BONUS = 2000;
export const INPUT_CHARACTERS_MAX_COUNT = 20;
export const GUILD_CREATION_COST = 200000;
export const MARKET_PRICE_CAP = 100000000;
export const GUILD_BASE_STATS = {
	vitality: 0.25,
	defense: 0.31,
	dexterity: 0.32,
	intelligence: 0.25,
	strength: 0.45,
	// itemstats: {}
};

export const RDT_ADMIN_PERMISSION = "ADMINISTRATOR";

export const GUILD_MARKET_IDS = [ 2, 5 ];
export const GUILD_MAX_DONATION = 1000000;
export const GUILD_MAX_LEVEL = 110;
export const GUILD_MIN_LEVEL_FOR_ITEM_BONUS = 100;
export const SOUL_ID = 2;
export const SEAL_ID = 5;
export const GUILD_ITEM_PROPERTIES = {
	SOUL_ID: "souls",
	SEAL_ID: "seals",
};

export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	year: "2-digit",
	month: "short",
	day: "numeric",
};

export const MANA_PER_BATTLE = 5;

export const CANVAS_DEFAULTS = {
	width: 708,
	height: 630,
	cardWidth: 473,
	cardHeight: 630,
	iconWidth: 64,
	iconHeight: 64,
};

export const EMBED_DEFAULT_COLOR = 13148872;

export const BATTLE_ROUNDS_COUNT = 15;

export const REQUIRED_TRADE_LEVEL = 8;

export const MAX_TEAMS_ALLOWED = 5;

export const SPBT_REQUIRED_MANA = 2;

export const MAX_RAID_LOBBY_MEMBERS = 6;
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

export const BATTLES_PER_CHANNEL = 1;
export const BATTLE_FORFEIT_RETRIES = 1;

export const USER_XP_GAIN_PER_BATTLE = 4;

export const MAX_GOLD_IN_TRADE = 10000000;
export const MAX_CARDS_IN_TRADE = 1000;

export const SACRIFICE_GOLD_COST = 1350;

export const ENCHANTMENT_ALLOWED_RANKS = [ "silver", "gold", "platinum" ];

export const MARKET_PURCHASE_LIMIT = 5;

export const MAX_CHOSEN_SKINS_ALLOWED = 20;

export const MIN_RAID_USER_LEVEL = 5;
export const HIGH_LEVEL_RAIDS = [ "h", "i", "hard", "immortal" ];

export const BOT_GLOBAL_PERMISSIONS: PermissionString[] = [
	"ADD_REACTIONS",
	"ATTACH_FILES",
	"EMBED_LINKS",
	"SEND_MESSAGES",
	"READ_MESSAGE_HISTORY",
	"USE_APPLICATION_COMMANDS",
	"CONNECT",
	"SPEAK"
];

export const THREAD_CHANNEL_PERMISSIONS = [
	"SEND_MESSAGES_IN_THREADS"
];

export const MAX_REQUESTS_PER_CHANNEL = 5;

export const MAX_GUILD_ITEMS_PURCHASABLE = 50;