import { DzFuncProps } from "@customTypes/darkZone";
import { getCharacterCardByRank } from "api/controllers/CardsController";
import { getCharacterById } from "api/controllers/CharactersController";
import { updateRawDzProfile } from "api/controllers/DarkZoneController";
import { createDzInventory } from "api/controllers/DarkZoneInventoryController";
import { getTotalDonations } from "api/controllers/DonationsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { IZZI_WEBSITE } from "environment";
import { numericWithComma } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
	ULTIMATE_1k_DONATION,
} from "helpers/constants/constants";
import {
	DZ_CARD_COST,
	DZ_INVENTORY_SLOTS_PER_LEVEL,
	DZ_STARTER_CARD_STATS,
	DZ_STARTER_INVENTORY_SLOTS,
} from "helpers/constants/darkZone";
import { ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { checkEventCardAvailability } from "utility";

const XENEX_SERIES = "xenex";

export const calculateDzCardCost = (level: number) => {
	let price = DZ_CARD_COST;
	if (level >= 100) {
		price = price + 400000;
	} else if (level >= 75) {
		price = price + 300000;
	} else if (level >= 50) {
		price = price + 200000;
	} else if (level >= 25) {
		price = price + 100000;
	}
	return price;
};

export const buyDzCard = async ({
	context,
	client,
	options,
	args,
	dzUser,
}: DzFuncProps) => {
	try {
		const { author } = options;
		const id = parseInt(args.shift() || "0");
		if (id <= 0 || isNaN(id)) return;
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);

		// Need to subtract 1, since when starting an acc your level is 1
		const maxSlots =
      dzUser.level * DZ_INVENTORY_SLOTS_PER_LEVEL +
      (DZ_STARTER_INVENTORY_SLOTS - DZ_INVENTORY_SLOTS_PER_LEVEL);
		if (dzUser.inventory_count >= maxSlots) {
			embed.setDescription(
				`Summoner **${author.username}**, You have already reached the maximum number of ` +
          `cards you can hold in your inventory **[${numericWithComma(
          	dzUser.inventory_count
          )} / ${numericWithComma(maxSlots)}]**. ` +
          `Level up to increase the limit! Current level: ${dzUser.level}`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const [ user, character ] = await Promise.all([
			getRPGUser({ user_tag: author.id }),
			getCharacterById({ id }),
		]);
		if (!user) return;
		const cost = calculateDzCardCost(dzUser.level);
		if (user.gold < cost) {
			embed.setDescription(
				"You do not have sufficient gold to purchase this card. " +
          `__${numericWithComma(cost)}__ Gold ${emoji.gold} Needed.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (!character) {
			embed.setDescription(
				"We could not find the character you were looking for."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const card = await getCharacterCardByRank({
			character_id: character.id,
			rank: ranksMeta.immortal.name,
		});
		if (!card) {
			embed.setDescription(
				"We could not find the character you were looking for. Please contact support."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (
			card.card_type_metadata?.isEvent &&
      card.has_event_ended &&
      !user.is_premium
		) {
			embed.setDescription(
				"Past event cards are only available to premium users. " +
          `[Get Premium Now](${IZZI_WEBSITE}/premiums)`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (card.series === XENEX_SERIES) {
			const totalDonations = await getTotalDonations(author.id);
			if (!totalDonations?.sum || +totalDonations.sum < ULTIMATE_1k_DONATION) {
				embed.setDescription(
					"Xenex series cards are only available to players with role Ultimate 1k. " +
            "Contact Hoax for more info."
				);
				context.channel?.sendMessage(embed);
				return;
			}
		}
		// const isCardAvailable = checkEventCardAvailability(card);
		// if (!isCardAvailable) {
		// 	embed.setDescription(
		// 		`**${titleCase(character.name)}** is not available. (Expired event cards are not available)`
		// 	);
		// 	context.channel?.sendMessage(embed);
		// 	return;
		// }
		user.gold = user.gold - cost;
		await Promise.all([
			updateRPGUser({ user_tag: author.id }, { gold: user.gold }),
			createDzInventory({
				character_id: character.id,
				character_level: STARTER_CARD_LEVEL,
				exp: STARTER_CARD_EXP,
				r_exp: STARTER_CARD_R_EXP,
				rank: ranksMeta.immortal.name,
				rank_id: ranksMeta.immortal.rank_id,
				stats: DZ_STARTER_CARD_STATS,
				user_tag: author.id,
				is_favorite: false,
				is_on_market: false,
				is_tradable: true,
			}),
			updateRawDzProfile(
				{ user_tag: author.id },
				{
					// This is the count for number of cards in your inventory
					inventory_count: {
						op: "+",
						value: 1,
					},
				}
			),
		]);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully spent __${numericWithComma(cost)}__ Gold ${
					emoji.gold
				} ` +
          `and received 1x **Level ${STARTER_CARD_LEVEL}** __${titleCase(
          	ranksMeta.immortal.name
          )}__ ` +
          `**${titleCase(character.name)}**`
			);

		try {
			const canvas = await createSingleCanvas(
				{
					metadata: card.metadata,
					type: character.type,
					rank: card.rank,
					filepath: card.metadata?.assets?.small.filepath || card.filepath,
				},
				false,
				"small"
			);
			if (canvas) {
				const attachment = createAttachment(
					canvas.createJPEGStream(),
					"card.jpg"
				);
				embed.attachFiles([ attachment ]).setThumbnail("attachment://card.jpg");
			}
		} catch (err) {
			//
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("buy.BuyDzCard: ERROR", err);
		return;
	}
};
