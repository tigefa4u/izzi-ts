import { DzFuncProps } from "@customTypes/darkZone";
import { getCollection } from "api/controllers/CollectionsController";
import { getDzTeam, updateDzTeam } from "api/controllers/DarkZoneTeamsController";
import { getItemById } from "api/controllers/ItemsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const equipDzItem = async ({ context, client, args, options }: DzFuncProps) => {
	try {
		const { author } = options;
		const itemId = parseInt(args.shift() || "0");
		const position = parseInt(args.shift() || "0");
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (itemId <= 0 || isNaN(itemId) || position <= 0 || isNaN(position)) {
			embed.setDescription("Please enter a valid position and item ID. `iz dz tm equip <itemID> <position>`");
			context.channel?.sendMessage(embed);
			return;
		}
		const [ dzTeam, user ] = await Promise.all([
			getDzTeam(author.id),
			getRPGUser({ user_tag: author.id }, { cached: true })
		]);
		if (!user) return;
		if (!dzTeam) {
			embed.setDescription(`Summoner **${author.username}**, You do not have a valid ` +
            "Dark Zone team, use `iz dz tm set <#ID> <position>` to set assign a card.");
			context.channel?.sendMessage(embed);
			return;
		}
		const item = await getCollection({
			item_id: itemId,
			is_item: true,
			user_id: user.id
		});
		if (!item) {
			embed.setDescription("We could not find the item you were looking for in your inventory.");
			context.channel?.sendMessage(embed);
			return;
		}
		const idx = dzTeam.team.findIndex((t) => t.item_id === itemId);
		if (idx >= 0) {
			dzTeam.team[idx] = {
				...dzTeam.team[idx],
				item_id: null,
				itemPosition: idx + 1,
				itemName: null
			};
		}
		const itemData = await getItemById({ id: item[0].item_id });
		if (!itemData) return;
		dzTeam.team[position - 1] = {
			...dzTeam.team[position - 1],
			item_id: itemId,
			itemName: itemData.name,
			itemPosition: position
		};
		await updateDzTeam(author.id, { team: JSON.stringify(dzTeam.team) as any });
		context.channel?.sendMessage(`Successfully equipped **${titleCase(itemData.name)}** ` +
        `${emojiMap(itemData.name)} on position __${position}__`);
		return;
	} catch (err) {
		loggers.error("equipDzItem: ERROR", err);
		return;
	}
};