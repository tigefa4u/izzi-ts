import { AuthorProps } from "@customTypes";
import { Client, CommandInteraction, Message } from "discord.js";

export type BaseProps = {
    context: Message | CommandInteraction;
    client: Client;
    command?: CommandProps;
    args: string[];
    options: {
        author: AuthorProps,
    }
}

export type CommandMapProps = {
	collection: (params: BaseProps) => void;
    ping: (params: BaseProps) => void;
    invite: (params: BaseProps) => void;
    cinfo: (params: BaseProps) => void;
    help: (params: BaseProps) => void;
    bet: (params: BaseProps) => void;
    profile: (params: BaseProps) => void;
    mana: (params: BaseProps) => void;
    exp: (params: BaseProps) => void;
    level: (params: BaseProps) => void;
    shards: (params: BaseProps) => void;
    orbs: (params: BaseProps) => void;
    points: (params: BaseProps) => void;
    permits: (params: BaseProps) => void;
    gold: (params: BaseProps) => void;
	start: (params: BaseProps) => void;
	hourly: (params: BaseProps) => void;
	server: (params: BaseProps) => void;
	daily: (params: BaseProps) => void;
	premium: (params: BaseProps) => void;
	donate: (params: BaseProps) => void;
	dex: (params: BaseProps) => void;
	ability: (params: BaseProps) => void;
	items: (params: BaseProps) => void;
	iteminfo: (params: BaseProps) => void;
	lottery: (params: BaseProps) => void;
	give: (params: BaseProps) => void;
	floor: (params: BaseProps) => void;
	zone: (params: BaseProps) => void;
	packs: (params: BaseProps) => void;
	compare: (params: BaseProps) => void;
	cards: (params: BaseProps) => void;
	status: (params: BaseProps) => void;
	skins: (params: BaseProps) => void;
	itemshop: (params: BaseProps) => void;
	market: (params: BaseProps) => void;
	redirect: (params: BaseProps) => void;
	consume: (params: BaseProps) => void;
	leaderboard: (params: BaseProps) => void;
	propose: (params: BaseProps) => void;
	divorce: (params: BaseProps) => void;
	guild: (params: BaseProps) => void;
	crate: (params: BaseProps) => void;
	info: (params: BaseProps) => void;
	select: (params: BaseProps) => void;
	equip: (params: BaseProps) => void;
	unequip: (params: BaseProps) => void;
	favorite: (params: BaseProps) => void;
	battle: (params: BaseProps) => void;
	trade: (params: BaseProps) => void;
	sacrifice: (params: BaseProps) => void;
	evolution: (params: BaseProps) => void;
	team: (params: BaseProps) => void;
	update: (params: BaseProps) => void;
	// spbt: (params: BaseProps) => void; // temporarily removed
	raid: (params: BaseProps) => void;
	event: (params: BaseProps) => void;
	dungeon: (params: BaseProps) => void;
	enchantment: (params: BaseProps) => void;
	laugh: (params: BaseProps) => void;
	glare: (params: BaseProps) => void;
	pout: (params: BaseProps) => void;
	baka: (params: BaseProps) => void;
	run: (params: BaseProps) => void;
	dodge: (params: BaseProps) => void;
	dance: (params: BaseProps) => void;
	hug: (params: BaseProps) => void;
	punch: (params: BaseProps) => void;
	"tight-hug": (params: BaseProps) => void;
	"slow-kiss": (params: BaseProps) => void;
	kiss: (params: BaseProps) => void;
	kill: (params: BaseProps) => void;
	bite: (params: BaseProps) => void;
	slap: (params: BaseProps) => void;
	cuddle: (params: BaseProps) => void;
	pat: (params: BaseProps) => void;
	lick: (params: BaseProps) => void;
	spank: (params: BaseProps) => void;
	poke: (params: BaseProps) => void;
	cry: (params: BaseProps) => void;
	bonk: (params: BaseProps) => void;
    // TODO: below commands
	// customize: (params: BaseProps) => void; // removed
	// sort: (params: BaseProps) => void; // removed
	// pvp: (params: BaseProps) => void; // removed
}

export type CommandProps = {
    id?: string;
    name: string;
    description: string;
    alias: string[];
    type: string;
    usage: string;
	sub_commands: {
		[key: string]: {
			title: string;
			description: string;
		};
	};
}

export type CommandCategoryProps = {
    basics: (props: BaseProps) => void;
    information: (props: BaseProps) => void;
    gamble: (props: BaseProps) => void;
    profile: (props: BaseProps) => void;
    adventure: (props: BaseProps) => void;
    guilds: (props: BaseProps) => void;
    dungeons: (props: BaseProps) => void;
    shop: (props: BaseProps) => void;
    inventory: (props: BaseProps) => void;
    miscellaneous: (props: BaseProps) => void;
    marriage: (props: BaseProps) => void;
    emotions: (props: BaseProps) => void;
    actions: (props: BaseProps) => void;
}
