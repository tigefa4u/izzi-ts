import { titleCase } from "title-case";
import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { createCollection } from "api/controllers/CollectionsController";
import { createUser } from "api/controllers/UsersController";
import { getRandomCard } from "api/models/Cards";

import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { checkExistingAccount, validateAccountCreatedAt } from "helpers";
import {
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
	message,
	client,
	options,
}) => {
	try {
		const author = options?.author;
		if (!author) return;
		const embed = createEmbed(message.member)
			.setTitle("Error :no_entry:")
			.setThumbnail(client.user?.displayAvatarURL() || "")
			.setAuthor(author.username, author.displayAvatarURL());

		const userExists = await checkExistingAccount(author.id);
		if (userExists) {
			embed.setDescription(
				"You have already started your journey in the Xenverse"
			);
			message.channel.sendMessage(embed);
			return;
		}

		const isAccountValid = validateAccountCreatedAt(author);
		if (!isAccountValid) {
			embed.setDescription(
				"Your discord account must be atleast 60 days old, in order to start your journey in the Xenverse!"
			);
			message.channel.sendMessage(embed);
			return;
		}
		const cardDetails = await startUserJourney(author);
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
          `**${titleCase(cardDetails.name)}**` +
          "\nGood Luck, Happy Collecting!"
			);

		message.channel.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.startJourney.start: something went wrong",
			err
		);
		return;
	}
};
