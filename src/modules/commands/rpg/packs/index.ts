import { BaseProps } from "@customTypes/command";
import { getRandomCard } from "api/controllers/CardsController";
import { directUpdateCreateFodder } from "api/controllers/CollectionsController";
import { getRandomCustomCard } from "api/controllers/CustomServerCardsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { createSingleCanvas } from "helpers/canvas";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_PACK,
	DEFAULT_SUCCESS_TITLE,
	IZZI_OS_SERVER_ID,
} from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const packs = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const cmd = args[0];
		let isCustomFodder = false;
		if (cmd === "custom") {
			args.shift();
			isCustomFodder = true;
		}
		let num = Number(args.shift());
		if (isNaN(num)) {
			num = 1;
		} else if (num > DEFAULT_PACK.num) {
			num = DEFAULT_PACK.num;
		}
		const cost = (DEFAULT_PACK.cost * (isCustomFodder ? 2 : 1)) * num;
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE);
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.gold < cost) {
			embed.setDescription("You do not have sufficient gold to purchase packs");
			context.channel?.sendMessage(embed);
			return;
		}
		user.gold = user.gold - cost;
		let details;
		if (isCustomFodder) {
			const customCards = await getRandomCustomCard(IZZI_OS_SERVER_ID);
			if (!customCards) {
				embed.setDescription("There are no custom cards available at this moment.");
				context.channel?.sendMessage(embed);
				return;
			}
			const card = await getRandomCard({
				character_id: customCards[0].character_id,
				rank: DEFAULT_PACK.rank,
				is_random: false
			}, 1);
			if (!card) {
				embed.setDescription("There are no custom cards available at this moment.");
				context.channel?.sendMessage(embed);
				return;
			}
			details = card[0];
		} else {
			const card = await getRandomCard({ rank: DEFAULT_PACK.rank }, 1);
			if (!card) return;
			details = card[0];
		}

		await Promise.all([
			updateRPGUser({ user_tag: author.id }, { gold: user.gold }),
			directUpdateCreateFodder([ {
				user_id: user.id,
				character_id: details.character_id,
				count: DEFAULT_PACK.cardPerPage * num
			} ]),
		]);
		const canvas = await createSingleCanvas(details, false);
		const attachment = createAttachment(
			canvas?.createJPEGStream() || "",
			"card.jpg"
		);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully spent __${cost}__ gold ${
					emoji.gold
				} and received __${DEFAULT_PACK.cardPerPage * num}x__ **${titleCase(
					details.name
				)}** ${titleCase(DEFAULT_PACK.rank)} card.`
			)
			.setThumbnail("attachment://card.jpg")
			.attachFiles([ attachment ]);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.packs.packs: ERROR", err);
		return;
	}
};
