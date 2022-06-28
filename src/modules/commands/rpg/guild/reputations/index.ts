import { BaseProps } from "@customTypes/command";
import { updateGuildMember } from "api/controllers/GuildMembersController";
import { updateGuild } from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, MAX_GUILD_REPUTATION_POINTS, MINIMUM_LEVEL_FOR_REPUTATION } from "helpers/constants";
import loggers from "loggers";
import {
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import { verifyMemberPermissions } from "..";

export const repGuild = async ({
	context,
	options,
	client,
}: BaseProps) => {
	try {
		const author = options.author;
		const key = "guild-reputation";
		const cd = await getCooldown(author.id, key);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, key);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (user.level < MINIMUM_LEVEL_FOR_REPUTATION) {
			embed.setDescription(`Summoner **${author.username}**, You must be atleast ` +
            `level __${MINIMUM_LEVEL_FOR_REPUTATION}__ to endorse your guild.`);
			context.channel?.sendMessage(embed);
			return;
		}
		const rep = 1;
		if (isNaN(rep)) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [],
			isOriginServer: true,
			isAdmin: false,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		validGuild.guild.points = validGuild.guild.points + rep;
		validGuild.member.supporter_points = validGuild.member.supporter_points + rep;


		if (validGuild.member.supporter_points > MAX_GUILD_REPUTATION_POINTS) {
			embed.setDescription("You have already given the " +
            `Max allowed reputations **[${MAX_GUILD_REPUTATION_POINTS}]** to your guild.`);
			context.channel?.sendMessage(embed);
			return;
		}
		await Promise.all([
			updateGuildMember({ user_id: user.id }, { supporter_points: validGuild.member.supporter_points }),
			updateGuild(
				{ guild_id: validGuild.guild.guild_id },
				{ points: validGuild.guild.points }
			),
			setCooldown(author.id, key, 60 * 60 * 5),
		]);

		embed.setTitle("Guild Reputation :exclamation:")
			.setDescription(
				`Summoner **${
					author.username
				}**, You have supported your guild with **POSITIVE** feedback.\n• ${
					validGuild.guild.name
				} currently has __${validGuild.guild.points}__ **Reputation Points.**` +
                `\n• You currently have __${validGuild.member.supporter_points}__ **Supporter Points.**`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.guild.reputations.repGuild()", err);
		return;
	}
};

export const reportGuild = async ({
	context,
	client,
	options
}: BaseProps) => {
	try {
		const author = options.author;
		const key = "guild-reputation";
		const cd = await getCooldown(author.id, key);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, key);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const num = 1;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [],
			isOriginServer: true,
			isAdmin: false,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		validGuild.member.supporter_points = validGuild.member.supporter_points - num;
		validGuild.guild.points = validGuild.guild.points - num;

		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);

		if (validGuild.member.supporter_points < -MAX_GUILD_REPUTATION_POINTS) {
			embed.setDescription("You have already reported your guild too many times, " +
            "if you are still facing issues with your guild please contact support.");
			context.channel?.sendMessage(embed);
			return;
		}
		await Promise.all([
			updateGuildMember({ user_id: user.id }, { supporter_points: validGuild.member.supporter_points }),
			updateGuild(
				{ guild_id: validGuild.guild.guild_id },
				{ points: validGuild.guild.points }
			),
			setCooldown(author.id, key, 60 * 60 * 5),
		]);

		embed.setTitle("Guild Reputation :exclamation:")
			.setDescription(
				`Summoner **${
					author.username
				}**, You have supported your guild with **NEGATIVE** feedback.\n• ${
					validGuild.guild.name
				} currently has __${validGuild.guild.points}__ **Reputation Points.**` +
                `\n• You currently have __${validGuild.member.supporter_points}__ **Supporter Points.**`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.guild.reputations.reportGuild()", err);
		return;
	}
};