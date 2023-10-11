import emoji from "emojis/emoji";
import { MIN_LEVEL_FOR_DZ_TRADE } from "helpers/constants/darkZone";

export const subcommands = [ {
	name: "commands", // list all dark zone commands
	alias: [ "command", "cmd" ],
	description: "List all Dark Zone commands.",
}, {
	name: "start",
	alias: [],
	description: "Start your journey in the Dark Zone. You must be at least level 50 to access Dark Zone.",
}, {
	name: "profile",
	alias: [ "p" ],
	description: "View a players Dark Zone profile. `iz dz p <@user>`.",
}, {
	name: "adventure",
	alias: [ "adv" ],
	description: "Idle adventure. Send your character on an advanture for 1 hour to gain loot and exp.",
}, {
	name: "spawn",
	alias: [ "sp" ],
	description: "Spawn Dark Zone raid. All commands are same as izzi raid commands.",
}, {
	name: "battle",
	alias: [ "bt" ],
	description: "Initiate a floor boss battle. Defeat the boss to receive " +
    `gold ${emoji.gold}, Fragments ${emoji.fragments} and exp :card_index:.`,
}, {
	name: "pvp",
	alias: [],
	description: "Challenge a player to a PvP battle!",
}, {
	name: "give",
	alias: [],
	description: `Transfer Fragments ${emoji.fragments} to another Summoner. ` +
    `Both summoners must be at least level ${MIN_LEVEL_FOR_DZ_TRADE}.`,
}, {
	name: "showcase",
	alias: [],
	description: "Showcase a card on your Dark Zone profile.\n**[Example] iz dz showcase <#ID>**"
} ];