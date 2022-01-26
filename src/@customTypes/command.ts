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
	// collection: (params: BaseProps) => void; // TODO
    ping: (params: BaseProps) => void;
    invite: (params: BaseProps) => void;
    cinfo: (params: BaseProps) => void;
    help: (params: BaseProps) => void;
    bet: (params: BaseProps) => void;
    // profile: (params: BaseProps) => void; // TODO
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
	sort: (params: BaseProps) => void;
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

    // TODO: below commands
	// info: (params: BaseProps) => void;
	// select: (params: BaseProps) => void;
	// battle: (params: BaseProps) => void;
	// pvp: (params: BaseProps) => void;
	// spbt: (params: BaseProps) => void;
	// equip: (params: BaseProps) => void;
	// unequip: (params: BaseProps) => void;
	// trade: (params: BaseProps) => void;
	// enchantment: (params: BaseProps) => void;
	// team: (params: BaseProps) => void;
	// raid: (params: BaseProps) => void;
	// evolution: (params: BaseProps) => void;
	// event: (params: BaseProps) => void;
	// dungeon: (params: BaseProps) => void;
	// favorite: (params: BaseProps) => void;
	// sacrifice: (params: BaseProps) => void;
	// customize: (params: BaseProps) => void; // removed
}

export type CommandProps = {
    id?: string;
    name: string;
    description: string;
    alias: string[];
    type: string;
    usage: string;
}

export type CommandCategoryProps = {
    basics: (props: BaseProps) => void;
    information: (props: BaseProps) => void;
    gamble: (props: BaseProps) => void;
    profile: (props: BaseProps) => void;
    pvp: (props: BaseProps) => void;
    guilds: (props: BaseProps) => void;
    dungeons: (props: BaseProps) => void;
    shop: (props: BaseProps) => void;
    inventory: (props: BaseProps) => void;
    miscellaneous: (props: BaseProps) => void;
    marriage: (props: BaseProps) => void;
    emotions: (props: BaseProps) => void;
    actions: (props: BaseProps) => void;
}
