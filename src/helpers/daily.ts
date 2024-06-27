import { UserProps } from "@customTypes/users";
import emoji from "emojis/emoji";
import { DOT } from "./constants/constants";

export const prepareDailyRewardsDesc = (user: UserProps, goldReward?: string) => {
	return `${DOT} ${goldReward ? `__${goldReward}__` : "__2,000__ and 150xStreaks(up to 30)"} Gold ${emoji.gold}\n` +
    `${DOT} __${user.is_premium ? "6" : "3"}x__ Shards ${emoji.shard}\n` +
    `${DOT} __${user.is_premium ? "100" : "80"}x__ Fragments ${emoji.fragments}\n` +
    `${DOT} __${user.is_married ? "2" : "1"}x__ Raid Permit(s) ${emoji.raidpass}\n` +
    `${DOT} __${user.is_premium ? "25" : "20"}x__ Izzi Credits ${emoji.izzicredits}\n` +
    (user.is_married && !goldReward ? `${DOT} __2,000__ Gold ${emoji.gold} marriage bonus.\n` : "") +
    (user.is_premium ? `${DOT} __4IP__ ${emoji.izzipoints}\n` : "") +
    `${DOT} Your Mana and Dungeon Mana is refilled.`;
};