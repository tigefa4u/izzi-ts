import { BaseProps } from "@customTypes/command";
import { CustomCardProps, FakeProfileProps } from "@customTypes/users";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { IZZI_WEBSITE } from "environment";
import { getIdFromMentionedString, numericWithComma } from "helpers";
import loggers from "loggers";
import { titleCase } from "title-case";

const prepareFakeProfileDetails = (
	data: FakeProfileProps,
	username: string
) => {
	const selectedCard = data.cards.find((c) => c.selected === true);
	const fields: EmbedFieldData[] = [
		{
			name: `${emoji.premium} Profile`,
			value: username,
			inline: true,
		},
		{
			name: `${emoji.gold} Gold`,
			value: numericWithComma(data.info.gold),
			inline: true,
		},
		{
			name: `${emoji.crossedswords} Level`,
			value: numericWithComma(data.info.level),
			inline: true,
		},
		{
			name: `${emoji.izzipoints} Izzi Points`,
			value: numericWithComma(data.info.izzi_points),
			inline: true,
		},
		{
			name: "Shards / Orbs",
			value: `${emoji.shard} ${numericWithComma(data.info.shards)} / ${
				emoji.blueorb
			} ${numericWithComma(data.info.orbs)}`,
			inline: true,
		},
		{
			name: `${emoji.permitsic} Raid Permit(s)`,
			inline: true,
			value: numericWithComma(data.info.raid_pass),
		},
		{
			name: `${emoji.dagger} Selected Card`,
			value: selectedCard ? titleCase(selectedCard.name) : "Not selected",
			inline: true,
		},
		{
			name: `user Quote ${emoji.chat}`,
			value: data.info.status || "Set a status on the website to show here",
		},
	];

	return fields;
};

const prepareCustomCardDetails = (selectedCard: CustomCardProps, status: string) => {
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

export const customCard = async ({ context, options, args }: BaseProps) => {
	try {
		const author = options.author;
		let mentionId = getIdFromMentionedString(args.shift());
		if (!mentionId) {
			mentionId = author.id;
		}
		const user = await getRPGUser({ user_tag: mentionId });
		if (!user) return;
		const embed = createEmbed().setTitle("Custom Card " + emoji.dagger);
		const customCards = user.metadata?.fakeprofile?.cards;
		if (!customCards || customCards.length <= 0) {
			embed.setDescription(
				`Summoner **${user.username}** does not have a custom card. ` +
          `Click [here](${IZZI_WEBSITE}/@me/customcard) to create your custom card`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const selectedCard = customCards.find((c) => c.selected === true) || customCards[0];
		const { title, desc } = prepareCustomCardDetails(
			selectedCard,
			user.metadata.fakeprofile?.info.status || "Set your quote on website"
		);

		// Only silver is available for now....
		embed.setTitle(`${titleCase(title)} | Level 80`).setDescription(desc)
			.setImage(selectedCard.assets.silver.default.filepath);
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
