import { CollectionCreateProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getRandomCard } from "api/controllers/CardsController";
import { createCollection } from "api/controllers/CollectionsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { createSingleCanvas } from "helpers/canvas";
import {
	BASE_XP,
	DEFAULT_ERROR_TITLE,
	DEFAULT_PACK,
	DEFAULT_SUCCESS_TITLE,
} from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const packs = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		let num = Number(args.shift());
		if (isNaN(num)) {
			num = 1;
		} else if (num > DEFAULT_PACK.num) {
			num = DEFAULT_PACK.num;
		}
		const cost = DEFAULT_PACK.cost * num;
		const embed = createEmbed()
			.setAuthor({
				name: author.username,
				iconURL: author.displayAvatarURL(),
			})
			.setTitle(DEFAULT_ERROR_TITLE)
			.setThumbnail(client.user?.displayAvatarURL() || "");
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.gold < cost) {
			embed.setDescription("You do not have sufficient gold to purchase packs");
			context.channel?.sendMessage(embed);
			return;
		}
		user.gold = user.gold - cost;
		const card = await getRandomCard({ rank: DEFAULT_PACK.rank }, 1);
		if (!card) return;
		const cardDetails = card[0];
		const collections = [] as CollectionCreateProps[];
		Array(DEFAULT_PACK.cardPerPage * num)
			.fill(0)
			.map(() => {
				collections.push({
					rank: DEFAULT_PACK.rank,
					rank_id: DEFAULT_PACK.rank_id,
					user_id: user.id,
					character_id: cardDetails.character_id,
					character_level: 1,
					exp: 0,
					r_exp: BASE_XP + 5,
					is_item: false,
				});
			});

		await Promise.all([
			updateRPGUser({ user_tag: author.id }, { gold: user.gold }),
			createCollection(collections),
		]);
		const canvas = await createSingleCanvas(cardDetails, false);
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
					cardDetails.name
				)}** ${titleCase(DEFAULT_PACK.rank)} card.`
			)
			.setThumbnail("attachment://card.jpg")
			.attachFiles([ attachment ]);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.packs.packs(): something went wrong", err);
		return;
	}
};
