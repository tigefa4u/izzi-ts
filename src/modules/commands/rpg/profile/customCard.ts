import { BaseProps } from "@customTypes/command";
import { CardProps } from "@customTypes/users/customCards";
import { getCustomCards } from "api/controllers/CustomCardsController";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { IZZI_WEBSITE } from "environment";
import { getIdFromMentionedString } from "helpers";
import loggers from "loggers";
import { titleCase } from "title-case";

const prepareCustomCardDetails = (selectedCard: CardProps, status: string) => {
	const desc = `**Quote ${emoji.chat}**\n${status}\n\n**Series:** ${titleCase(
		selectedCard.series
	)}\n**Card Copies:** 1\n**Element Type:** ${titleCase(
		selectedCard.type
	)} ${emojiMap(
		selectedCard.type
	)}\n**Zone:** None\n**Floors:** None\n**RANK:** Silver\n**ATK:** ${selectedCard.stats.vitality}\n**HP:** ${
		selectedCard.stats.strength
	}\n**DEF:** ${selectedCard.stats.defense}\n**SPD:** ${
		selectedCard.stats.dexterity
	}\n**INT:** ${selectedCard.stats.intelligence}\n\n**Ability**\n**${titleCase(
		selectedCard.abilityname
	)}:** ${selectedCard.abilitydescription}`;

	return {
		title: selectedCard.name,
		desc 
	};
};

export const customCard = async ({ context, options, args, client }: BaseProps) => {
	try {
		const author = options.author;
		let mentionId = getIdFromMentionedString(args.shift());
		if (!mentionId) {
			mentionId = author.id;
		}
		const [ customCardDetails, mentionedUser ] = await Promise.all([
			getCustomCards(mentionId),
			client.users.fetch(mentionId)
		]);
		if (!mentionedUser) return;
		const embed = createEmbed(mentionedUser).setTitle("Custom Card " + emoji.dagger);
		if (!customCardDetails) {
			embed.setDescription(
				`Summoner **${mentionedUser.username}** does not have a custom card. ` +
          `Click [here](${IZZI_WEBSITE}/@me/customcard) to create your custom card`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const customCards = customCardDetails.cards;
		if (!customCards || customCards.length <= 0) {
			embed.setDescription(
				`Summoner **${mentionedUser.username}** does not have a custom card. ` +
          `Click [here](${IZZI_WEBSITE}/@me/customcard) to create your custom card`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const selectedCard = customCards.find((c) => c.selected === true) || customCards[0];
		const { title, desc } = prepareCustomCardDetails(
			selectedCard,
			customCardDetails.info?.status || "Set your quote on website"
		);

		// Only silver is available for now....
		embed.setTitle(`${titleCase(title)} | Level 80`).setDescription(desc)
			.setImage(selectedCard.assets.silver.default.filepath)
			.setFooter({
				iconURL: mentionedUser.displayAvatarURL(),
				text: `Summoner ID: ${mentionedUser.id}`
			});
		// fake profile will cause confusion
		// const fields = prepareFakeCardDetails(fakeProfile, user.username);
		// embed.setFields(fields);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("profile.fakeProfile.fakeProfileCard: ERROR", err);
		return;
	}
};
