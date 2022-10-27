import { titleCase } from "title-case";
import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { createCollection } from "api/controllers/CollectionsController";
import { createUser } from "api/controllers/UsersController";

import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { checkExistingAccount, validateAccountCreatedAt } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_RANK,
	STARTER_CARD_RANK_ID,
	STARTER_CARD_R_EXP,
	STARTER_GOLD,
} from "helpers/constants";
import loggers from "loggers";
import { createAttachment } from "commons/attachments";
import { createSingleCanvas } from "helpers/canvas";
import { getRandomCard } from "api/controllers/CardsController";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { starterGuide } from "./guide";

async function startUserJourney(author: AuthorProps) {
	const newUser = await createUser({
		user_tag: author.id,
		username: author.username,
		gold: STARTER_GOLD,
	});
	if (!newUser) {
		throw new Error("Unable to create new user");
	}
	loggers.info("modules.commands.rpg.profile.startJourney: Journey started");
	const card = await getRandomCard(
		{
			rank: STARTER_CARD_RANK,
			is_event: false,
			is_logo: false,
		},
		1
	);
	if (!card) return;
	const cardDetails = card[0];
	const collectionBodyParams = {
		r_exp: STARTER_CARD_R_EXP,
		exp: STARTER_CARD_EXP,
		rank: STARTER_CARD_RANK,
		rank_id: STARTER_CARD_RANK_ID,
		user_id: newUser.id,
		character_level: STARTER_CARD_LEVEL,
		character_id: cardDetails.character_id,
		is_item: false,
		is_on_cooldown: false
	};
	loggers.info(
		"modules.commands.rpg.profile.startJourney: New User created: " +
      JSON.stringify(newUser)
	);
	await createCollection(collectionBodyParams);
	loggers.info(
		"modules.commands.rpg.profile.startJourney: New User starter card: " +
      JSON.stringify(collectionBodyParams)
	);
	return cardDetails;
}

export const start: (params: BaseProps) => void = async ({
	context,
	client,
	options,
}) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE);

		const userExists = await checkExistingAccount(author.id);
		if (userExists) {
			embed.setDescription(
				"You have already started your journey in the Xenverse"
			);
			context.channel?.sendMessage(embed);
			return;
		}

		const isAccountValid = validateAccountCreatedAt(author);
		if (!isAccountValid) {
			embed.setDescription(
				"Your discord account must be atleast 60 days old, in order to start your journey in the Xenverse!"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const cardDetails = await startUserJourney(author);
		if (!cardDetails) return;
		const canvas = await createSingleCanvas(cardDetails, false);
		const attachment = createAttachment(
			canvas?.createJPEGStream() || "",
			"card.jpg"
		);

		embed
			.setTitle("Journey Started" + emoji.celebration)
			.attachFiles([ attachment ])
			.setThumbnail("attachment://card.jpg")
			.setDescription(
				"Congratulations summoner, you have successfully started your journey in **The Xenverse**!" +
          " " +
          "Collect champion cards and choose from your collections to battle against powerful enemies," +
          " " +
          "unique raid bosses and other summoners as well! You have received a starter" +
          " " +
          `__${titleCase(cardDetails.rank)}__ copy of` +
          " " +
          `**${titleCase(cardDetails.name)}** Use \`\`@izzi select 1\`\` to select the card.` +
          "\nGood Luck, Happy Collecting!"
			);

		const buttons = customButtonInteraction(
			context.channel,
			[
				{
					label: "Start Guide",
					params: {
						context,
						client,
						args: [],
						options,
					}
				}
			],
			author.id,
			starterGuide,
			() => {
				return;
			},
			false,
			1
		);

		if (buttons) {
			embed.setButtons(buttons);
		}
	
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.startJourney.start: ERROR",
			err
		);
		return;
	}
};
