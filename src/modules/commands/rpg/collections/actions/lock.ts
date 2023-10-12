import { BaseProps } from "@customTypes/command";
import { getCharacters } from "api/controllers/CharactersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { CACHE_KEYS } from "helpers/constants/cacheConstants";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { fetchParamsFromArgs } from "utility/forParams";

/**
 * This feature allows using -exclude in Enchant much easier
 * you can just lock the cards you dont want to consume once
 * @param param0
 * @returns
 */
export const lockFodders = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const { author } = options;
		const key = CACHE_KEYS.ENH_LOCK + author.id;
		const params = fetchParamsFromArgs<{ name: string | string[]; isExactMatch: boolean; }>(args);
		if (!params.name || params.name.length <= 0) return;
		const cachedData = await Cache.get(key);
		let lockedCards = [];
		if (cachedData) {
			lockedCards = JSON.parse(cachedData).lockcards;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (lockedCards.length >= 10) {
			embed.setDescription("You cannot lock more than 10 cards.");
			context.channel?.sendMessage(embed);
			return;
		}
		if (lockedCards.length > 0 && typeof params.name === "object") {
			const diff = 10 - lockedCards.length;
			params.name = params.name.slice(0, diff);
		}
		const characters = await getCharacters({
			name: params.name,
			isExactMatch: params.isExactMatch 
		});
		if (!characters || characters.length <= 0) {
			embed.setDescription("The character you are looking for does not exist.");
			context.channel?.sendMessage(embed);
			return;
		}
		if (characters.length > 10) {
			embed.setDescription("You cannot lock more than 10 characters.");
			context.channel?.sendMessage(embed);
			return;
		}
		const result = characters.map((c) => ({
			id: c.id,
			name: c.name,
		}));
		lockedCards = [
			...new Set([
				...lockedCards,
				...result
			])
		];
		await Cache.set(key, JSON.stringify({ lockcards: lockedCards }));
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				"The following Platinum Fodders are locked and will not be consumed during Enchantment.\n\n" +
          `**${lockedCards
          	.map((r) => titleCase(r.name))
          	.join(
          		"\n"
          	)}**\n\nTo unlock these fodders to be able to consume them ` +
          "type `iz inv unlock <#lockID>`."
			);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("collections.actions.lockFodders: ERRRO", err);
		return;
	}
};
