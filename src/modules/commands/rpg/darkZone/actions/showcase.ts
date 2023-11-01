import { CardMetadataProps } from "@customTypes/cards";
import { DzFuncProps } from "@customTypes/darkZone";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { updateDzProfile } from "api/controllers/DarkZoneController";
import { createEmbed } from "commons/embeds";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
} from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const showcaseDzCard = async ({
	context,
	dzUser,
	options,
	args,
	client,
}: DzFuncProps) => {
	try {
		const { author } = options;
		const rowNum = parseInt(args.shift() || "0");
		if (rowNum <= 0 || isNaN(rowNum)) return;
		const cards = await getCardInfoByRowNumber({
			row_number: rowNum,
			user_tag: author.id,
			user_id: 0,
			isDarkZone: true,
		});
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);

		const card = (cards || [])[0];
		if (!card) {
			embed.setDescription(
				"We could not find the card you were looking for in your Dark Zone inventory"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		dzUser.metadata = {
			...dzUser.metadata,
			showcase: {
				selected_card_id: card.id,
				character_id: card.character_id,
				name: card.metadata?.nickname || card.name,
				metadata: card.metadata || ({} as CardMetadataProps),
				filepath: card.filepath,
				type: card.type,
				rank: card.rank,
			},
		};
		await updateDzProfile(
			{ user_tag: author.id },
			{ metadata: dzUser.metadata }
		);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully selected **Level ${card.character_level}** ` +
          `__${titleCase(card.rank)}__ **${titleCase(
          	dzUser.metadata.showcase?.name || ""
          )}** to be showcased on your profile.`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("showcaseDzCard: ERROR", err);
		return;
	}
};
