import { DzFuncProps } from "@customTypes/darkZone";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import {
	getDarkZoneProfile,
	updateRawDzProfile,
} from "api/controllers/DarkZoneController";
import { updateDzInv } from "api/controllers/DarkZoneInventoryController";
import { getDzTeam, updateDzTeam } from "api/controllers/DarkZoneTeamsController";
import { createEmbed } from "commons/embeds";
import { getIdFromMentionedString } from "helpers";
import { DEFAULT_ERROR_TITLE, DOT } from "helpers/constants/constants";
import {
	DZ_INVENTORY_SLOTS_PER_LEVEL,
	DZ_STARTER_INVENTORY_SLOTS,
	MIN_LEVEL_FOR_DZ_TRADE,
} from "helpers/constants/darkZone";
import loggers from "loggers";
import { titleCase } from "title-case";

export const giveDzCard = async ({
	context,
	client,
	args,
	options,
	dzUser,
}: DzFuncProps) => {
	try {
		const { author } = options;

		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		if (dzUser.level < MIN_LEVEL_FOR_DZ_TRADE) {
			embed.setDescription(
				`Summoner **${author.username}**, must be atleast ` +
          `Dark Zone level ${MIN_LEVEL_FOR_DZ_TRADE} to give and receive cards.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const rowNums = args.shift();
		const mentionId = getIdFromMentionedString(args.shift());
		if (!rowNums || !mentionId || mentionId === author.id) return;
		const ids = rowNums
			.split(",")
			.map((r) => Number(r))
			.slice(0, 10);

		const collections = await getCardInfoByRowNumber({
			isDarkZone: true,
			user_id: dzUser.user_id,
			user_tag: dzUser.user_tag,
			row_number: ids,
		});
		if (!collections || collections.length <= 0) {
			embed.setDescription(
				"We could not find the cards you were looking for in your Dark Zone inventory."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const cardsOnMarket = collections.filter((c) => c.is_on_market);
		if (cardsOnMarket.length > 0) {
			embed.setDescription(
				"You cannot give cards that are on the Dark Zone Market."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const mentionedDzUser = await getDarkZoneProfile({ user_tag: mentionId });
		if (!mentionedDzUser) {
			embed.setDescription(
				"The mentioned user does not have a Dark Zone profile."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (mentionedDzUser.level < MIN_LEVEL_FOR_DZ_TRADE) {
			embed.setDescription(
				`Summoner **${mentionedDzUser.metadata?.username}**, must be atleast ` +
          `Dark Zone level ${MIN_LEVEL_FOR_DZ_TRADE} to give and receive cards.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const maxSlots =
      mentionedDzUser.level * DZ_INVENTORY_SLOTS_PER_LEVEL +
      (DZ_STARTER_INVENTORY_SLOTS - DZ_INVENTORY_SLOTS_PER_LEVEL);
		const totalCount = mentionedDzUser.inventory_count + collections.length;
		if (totalCount > maxSlots) {
			embed.setDescription(
				`Summoner **${mentionedDzUser.metadata?.username}**, has already ` +
          "reached the maximum number of cards they can hold."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const promises: any[] = [
			updateRawDzProfile(
				{ user_tag: author.id },
				{
					inventory_count: {
						op: "+",
						value: collections.length,
					},
				}
			),
			updateRawDzProfile(
				{ user_tag: mentionedDzUser.user_tag },
				{
					inventory_count: {
						op: "-",
						value: collections.length,
					},
				}
			),
			updateDzInv(
				{
					id: collections.map((c) => c.id),
					user_tag: author.id,
				},
				{ user_tag: mentionedDzUser.user_tag }
			),
		];
		const dzTeam = await getDzTeam(author.id);
		const cids = collections.map((c) => c.id);
		const cardsInTeam = dzTeam?.team.filter((t) => cids.includes(t.collection_id || 0));
		if (cardsInTeam && cardsInTeam.length > 0 && dzTeam) {
			cardsInTeam.map((c) => {
				const idx = dzTeam.team.findIndex((t) => t.collection_id === c.collection_id);
				if (idx >= 0) {
					dzTeam.team[idx].collection_id = null;
				}
			});
			promises.push(updateDzTeam(author.id, { team: JSON.stringify(dzTeam.team) as any }));
		}
		await Promise.all(promises);
		embed.setDescription(
			`Successfully transferred the following cards to **${mentionedDzUser.metadata?.username}**\n\n` +
        `${collections
        	.map(
        		(c) =>
        			`${DOT} **Level ${c.character_level}** __${titleCase(
        				c.rank
        			)}__ **${titleCase(c.name)}**`
        	)
        	.join("\n")}`
		);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("darkZone.giveDzCard: ERROR", err);
		return;
	}
};
