import { BaseProps } from "@customTypes/command";
import { DungeonBanProps } from "@customTypes/dungeon";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import loggers from "loggers";
import { titleCase } from "title-case";

export const showDgBans = async ({ context, client, options }: BaseProps) => {
	try {
		const { author } = options;
		let desc = "There are currently no Item or Ability Bans.";
		const dgBans = await Cache.get("dg-bans");
		if (dgBans) {
			const item = JSON.parse(dgBans) as DungeonBanProps;
			const textMap: any = {
				itemBans: "Items Banned",
				abilityBans: "Abilities Banned",
			};
			if (item) {
				desc = Object.keys(textMap).map((k) => {
					return `**${textMap[k]}:** ${(item[k as keyof DungeonBanProps] || []).map(
						(it: any) => `${titleCase(it.name)} ${emojiMap(it.name)}`
					).join(", ")}`;
				}).join("\n");
			}
		}
		const embed = createEmbed(author, client).setTitle("Dungeon Bans")
			.setDescription(desc);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeons.v2.bans.showBans: ERROR", err);
		return;
	}
};