import emoji from "emojis/emoji";
import { DARK_ZONE_MIN_LEVEL } from "helpers/constants/constants";
import { MIN_LEVEL_FOR_DZ_TRADE } from "helpers/constants/darkZone";

export const subcommands = [ {
	name: "commands", // list all dark zone commands
	alias: [ "command", "cmd" ],
	description: "List all Dark Zone commands.",
}, {
	name: "start",
	alias: [],
	description: "Start your journey in the Dark Zone. You must be at least " +
	`level ${DARK_ZONE_MIN_LEVEL} to access Dark Zone.`,
}, {
	name: "profile",
	alias: [ "p" ],
	description: "View a players Dark Zone profile. `iz dz p <@user>`.",
}, {
	name: "console",
	alias: [ "cons" ],
	description: "View the number of Fragments, Exp and Inventory Slots. (Shorter version of `iz dz p`)"
}, {
	name: "inventory",
	alias: [ "inv" ],
	description: "Type `iz dz inv <filters>` to view your Dark Zone inventory. " +
	"You can use same filters used in `iz inv`."
}, {
	name: "adventure",
	alias: [ "adv" ],
	description: "Idle adventure. Spend 1 raid permit and send your team on an advanture " +
	"for 1 hour. " +
	"Type `iz dz adv complete` to complete your adventure and receive loot and rewards.\n" +
	"If you fail to complete the adventure in 24 hours, you will not receive any loot.\n" +
	"**When your team is on an adventure, you cannot spawn a dark zone raids.**",
},
{
	name: "team",
	alias: [ "tm" ],
	description: "Set your Dark Zone team to participate in floor battles and PvP.\n" +
	"`iz dz tm`->Shows team info.\n`iz dz tm set 1,2,3`->Sets the cards on your team " +
	"in their respective positions. Additionally you can use `iz dz tm set 1 1` to specify the position.\n" +
	"`iz dz tm select`->Select/Ready the Dark Zone team for battles.\n" +
	"`iz dz tm equip <itemId> <position>`->Equip an item on a team card."
},
{
	name: "spawn",
	alias: [],
	description: "Spawn Dark Zone raid. You must have a Dark Zone profile.",
}, 
{
	name: "battle",
	alias: [ "bt" ],
	description: "Initiate a floor boss battle. Defeat the boss to receive " +
    `gold ${emoji.gold}, Fragments ${emoji.fragments} and exp :card_index:.`,
}, {
	name: "pvp",
	alias: [],
	description: "Challenge a player to a PvP battle! `iz dz pvp <@user>`",
}, {
	name: "give",
	alias: [],
	description: `Transfer Fragments ${emoji.fragments} to another Summoner. ` +
    `Both summoners must be at least level ${MIN_LEVEL_FOR_DZ_TRADE}.`,
}, {
	name: "cgive",
	alias: [],
	description: "Transfer card to another Summoner. Both summoners must be at least level " + MIN_LEVEL_FOR_DZ_TRADE
}, {
	name: "showcase",
	alias: [],
	description: "Showcase a card on your Dark Zone profile.\n**[Example] iz dz showcase <#ID>**"
}, {
	name: "dex",
	alias: [],
	description: "Display all cards available on Dark Zone to purchase from. " +
	"Past event cards are only available to premium users."
}, {
	name: "buy",
	alias: [],
	description: "Purchase a card from Dark Zone dex. Past event cards are only available to premium users. "
}, {
	name: "enchantment",
	alias: [ "enh" ],
	description: `Enchant your card to increase its level. 1 Fragment ${emoji.fragments} = 200xp`
}, {
	name: "evolution",
	alias: [ "evo" ],
	description: "Evolve your card into the next rank! Costs 10,000 Fragments per evo."
}, {
	name: "stat-point",
	alias: [ "sp" ],
	description: "Spend Fragments to increase the **Base Stats** of your card. 1,000 Fragments = 1 Skill Point.\n" +
	"[Example] `iz dz sp <#ID> atk 5` -> Consume 5,000 Fragments and increase **ATK** permanently by 5 points."
}, {
	name: "market",
	alias: [ "mk" ],
	description: "To list all cards on the Dark Zone Market use `iz dz mk <filters>`.\n" +
	"To buy/sell/remove cards from the Dark Zone market use `iz dz mk sell <ID> <price>`.\n" +
	"To Purchase a card `iz dz mk buy <ID> -dz`\nType `iz dz mk remove <ID>` to remove card from the Dark Zone market."
}, {
	name: "Floor, Info, Nickname & Favorite",
	alias: [],
	description: "To info your card from Dark Zone inventory use `iz info <#ID> -dz`.\n" +
	"To give your card a nickname use `iz nick <#ID> <nickname> -dz`.\n" +
	"To move through different floors in the Dark Zone use `iz fl n -dz` or `iz fl <num> -dz`.\n" +
	"To favorite a card use `iz fav <#ID> -dz`"
} ];