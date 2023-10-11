import { BaseProps } from "@customTypes/command";
import { updateGuildMember } from "api/controllers/GuildMembersController";
import { updateGuild } from "api/controllers/GuildsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	GUILD_MAX_DONATION,
	MAX_GOLD_THRESHOLD,
} from "helpers/constants/constants";
import loggers from "loggers";
import { verifyMemberPermissions } from "..";

export const donateToGuild = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const donation = Number(args.shift());
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!donation || isNaN(donation) || donation > GUILD_MAX_DONATION) {
			embed.setDescription(
				"Invalid Donation Amount. Donation amount must be less than " +
          numericWithComma(GUILD_MAX_DONATION)
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.gold < donation) {
			embed.setDescription("You do not have sufficient Gold to Donate. :x:");
			context.channel?.sendMessage(embed);
			return;
		}
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [],
			isOriginServer: true,
			isAdmin: false,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		user.gold = user.gold - donation;
		validGuild.guild.gold = validGuild.guild.gold + donation;
		if (validGuild.guild.gold > MAX_GOLD_THRESHOLD) {
			embed.setDescription("Your guild has reached max " +
			`guild donation threshold __${MAX_GOLD_THRESHOLD}__, ` +
			"Please use the remaining guild gold to receive more donations.");
			context.channel?.sendMessage(embed);
			return;
		}
		let orbPerDonation = 0;
		if (donation > 1000) {
			orbPerDonation = Math.floor(donation / 1000);
			user.orbs = user.orbs + orbPerDonation;
		}
		validGuild.member.donation = validGuild.member.donation
			? validGuild.member.donation + donation
			: 0 + donation;
		validGuild.member.max_donation = validGuild.member.max_donation
			? validGuild.member.max_donation + donation
			: 0 + donation;

		const guildMemberUpdateParams = {
			donation: validGuild.member.donation,
			max_donation: validGuild.member.max_donation,
		} as { donation: number; max_donation?: number; };
		if (validGuild.member.max_donation > MAX_GOLD_THRESHOLD) {
			const newEmbed = createEmbed(author, client)
				.setTitle("GUILD DONATION NOTICE")
				.setDescription(`Summoner **${author.username}**, you've hit max guild ` +
				`donation threshold __${numericWithComma(MAX_GOLD_THRESHOLD)}__ ${emoji.gold}` +
				"your total guild donations will no longer increase, but your usable gold will be counted.");

			context.channel?.sendMessage(newEmbed);
			delete guildMemberUpdateParams.max_donation;
		}

		const promises = [
			updateRPGUser(
				{ user_tag: user.user_tag },
				{
					gold: user.gold,
					orbs: user.orbs,
				}
			),
			updateGuild({ id: validGuild.guild.id }, { gold: validGuild.guild.gold }),
			updateGuildMember(
				{ id: validGuild.member.id },
				guildMemberUpdateParams
			),
		];

		await Promise.all(promises);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Summoner ${
					author.username
				}, you have successfully donated __${numericWithComma(donation)}__ Gold ${
					emoji.gold
				} to your guild **${validGuild.guild.name}**!${
					orbPerDonation > 0
						? ` You have also received __${numericWithComma(orbPerDonation)}__${emoji.blueorb} Blue Orbs`
						: ""
				}`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.donations.donateToGuild: ERROR",
			err
		);
		return;
	}
};
