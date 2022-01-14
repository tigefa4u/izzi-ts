import { BaseProps } from "@customTypes/command";
import { updateGuildMember } from "api/controllers/GuildMembersController";
import { updateGuild } from "api/controllers/GuildsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, GUILD_MAX_DONATION } from "helpers/constants";
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
          GUILD_MAX_DONATION
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
			extras: { user_id: user.id }
		});
		if (!validGuild) return;
		user.gold = user.gold - donation;
		validGuild.guild.gold = validGuild.guild.gold + donation;
		let orbPerDonation = 0;
		if (donation > 1000) {
			orbPerDonation = Math.floor(donation / 1000);
			user.orbs = user.orbs + orbPerDonation;
		}
		await updateRPGUser({ user_tag: user.user_tag }, {
			gold: user.gold,
			orbs: user.orbs 
		});
		await updateGuild({ id: validGuild.guild.id }, { gold: validGuild.guild.gold });
		validGuild.member.donation = validGuild.member.donation
			? validGuild.member.donation + donation
			: 0 + donation;
		validGuild.member.max_donation = validGuild.member.max_donation
			? validGuild.member.max_donation + donation
			: 0 + donation;
		await updateGuildMember({ id: validGuild.member.id }, {
			donation: validGuild.member.donation,
			max_donation: validGuild.member.max_donation,
		});
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Summoner ${
				author.username
			}, you have successfully donated __${donation}__ Gold ${emoji.gold} to your guild **${
				validGuild.guild.name
			}**!${
				orbPerDonation > 0
					? ` You have also received __${orbPerDonation}__${emoji.blueorb} Blue Orbs`
					: ""
			}`);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.donations.donateToGuild(): something went wrong",
			err
		);
		return;
	}
};
