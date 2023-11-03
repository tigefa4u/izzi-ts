import { BaseProps } from "@customTypes/command";
import { DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { getRandomCard } from "api/controllers/CardsController";
import { createDarkZoneProfile, } from "api/controllers/DarkZoneController";
import { createDzInventory } from "api/controllers/DarkZoneInventoryController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { createSingleCanvas } from "helpers/canvas";
import {
	DARK_ZONE_MIN_LEVEL,
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	STARTER_CARD_EXP,
	STARTER_CARD_R_EXP,
} from "helpers/constants/constants";
import { DZ_STARTER_CARD_STATS } from "helpers/constants/darkZone";
import { ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const startDz = async ({ context, client, options, dzUser }: BaseProps & { dzUser?: DarkZoneProfileProps; }) => {
	try {
		const { author } = options;
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		if (dzUser) {
			embed.setDescription(
				`Summoner **${author.username}**, You have already started your journey in the dark zone. ` +
          "Use `iz dz p` to view your profile. Use `iz dz commands` to view list of dark zone commands."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) {
			embed.setDescription(
				`Summoner **${author.username}**, You have not started your journey ` +
          "in the Xenverse. Type `iz start`"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.level < DARK_ZONE_MIN_LEVEL) {
			embed.setDescription(
				`Summoner **${author.username}**, You must be at least ` +
          `level __${DARK_ZONE_MIN_LEVEL}__ to access Dark Zone.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const cards = await getRandomCard(
			{
				rank: ranksMeta.immortal.name,
				is_event: false,
				is_random: true,
				is_logo: false,
				is_world_boss: false,
				is_referral_card: false,
			},
			1
		);

		const card = (cards || [])[0];
		if (!card) {
			embed.setDescription(
				"Dark Zone is currently not available try again later."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		await Promise.all([
			createDzInventory({
				user_tag: author.id,
				character_id: card.character_id,
				character_level: ranksMeta.immortal.max_level || 70,
				rank: ranksMeta.immortal.name,
				rank_id: ranksMeta.immortal.rank_id,
				exp: STARTER_CARD_EXP,
				r_exp: STARTER_CARD_R_EXP,
				is_tradable: true,
				is_favorite: false,
				is_on_market: false,
				stats: DZ_STARTER_CARD_STATS,
			}),
			createDarkZoneProfile({
				user_tag: author.id,
				//Number of cards in your dz inventory. This is not the max slots
				inventory_count: 1,
				metadata: { username: author.username.replace(emoji.premium, "").trim() },
				user_id: user.id
			}),
		]);

		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Congratulations summoner **${author.username}**, Welcome to the Dark Zone. ` +
          `\nYou have received __1x__ **Level 70** __${titleCase(
          	ranksMeta.immortal.name
          )}__ ` +
          `**${titleCase(
          	card.name
          )}.**\nTo check your inventory use \`iz dz inv\`. To see a list of all available ` +
          "commands use `iz dz commands`. To view your profile use `iz dz p`." + 
          "\n\n**To learn more about Dark Zone checkout our blogs and tutorials.**" +
          "\n\n**GLHF, Happy Collecting!**"
			);

		try {
			const canvas = await createSingleCanvas(card, false);
			if (canvas) {
				const attachment = createAttachment(
					canvas.createJPEGStream(),
					"card.jpg"
				);
				embed.attachFiles([ attachment ]).setThumbnail("attachment://card.jpg");
			}
		} catch (err) {
			console.error("Unable to create canvas: ", err);
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("actions.startDz: ERROR", err);
		return;
	}
};
