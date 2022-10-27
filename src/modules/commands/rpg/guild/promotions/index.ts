import { BaseProps } from "@customTypes/command";
import {
	getGuildMember,
	updateGuildMember,
} from "api/controllers/GuildMembersController";
import { getGuildDetails } from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { getIdFromMentionedString } from "helpers";
import { DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { verifyMemberPermissions } from "..";

export const vpromote = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = args.shift();
		if (!id) return;
		const mentionedId = getIdFromMentionedString(id);
		const mentionedUser = await getRPGUser({ user_tag: mentionedId }, { cached: true });
		if (!mentionedUser || mentionedId === author.id) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		const guildDetails = await getGuildDetails({ id: validGuild.guild.id });
		const vice = guildDetails?.filter((g) => g.role === "vice_leader")[0];
		const embed = createEmbed(author);
		if (vice) {
			embed.setDescription(
				"Your guild already has a vice leader! use ``guild members`` to view your guild members"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const member = await getGuildMember({ user_id: mentionedUser.id });
		if (!member || member.guild_id !== validGuild.guild.id) {
			embed.setDescription(
				"This User is not in your guild! " +
          "use ``guild invite`` to invite them into your guild!"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		await updateGuildMember({ id: member.id }, {
			is_vice_leader: true,
			is_admin: false 
		});
		const thumb = context.guild?.iconURL() || client.user?.displayAvatarURL();
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setThumbnail(thumb || "")
			.setDescription(
				`Congratulations Summoner ${mentionedUser.username}! ` +
                `You are now the __Vice Leader__ of **${validGuild.guild.name}**`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.promotions.vpromote: ERROR",
			err
		);
		return;
	}
};

export const vdemote = async ({
	context,
	client,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		const guildDetails = await getGuildDetails({ id: validGuild.guild.id });
		const vice = guildDetails?.filter((g) => g.role === "vice_leader")[0];
		const embed = createEmbed(author);
		if (!vice) {
			embed.setDescription(
				"Your guild does not have a vice leader! use ``guild vpromote <@user>`` to appoint a Guild Vice Leader."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		await updateGuildMember({ user_id: vice.user_id }, { is_vice_leader: false });
		const thumb = context.guild?.iconURL() || client.user?.displayAvatarURL();
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setThumbnail(thumb || "")
			.setDescription("Your guild Vice Leader has been demoted!");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.promotions.vdemote: ERROR",
			err
		);
		return;
	}
};

export const apromote = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = args.shift();
		if (!id) return;
		const mentionedId = getIdFromMentionedString(id);
		const mentionedUser = await getRPGUser({ user_tag: mentionedId }, { cached: true });
		if (!mentionedUser || author.id === mentionedId) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader", "is_vice_leader" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		const guildDetails = await getGuildDetails({ id: validGuild.guild.id });
		const admin = guildDetails?.filter((g) => g.role === "admin")[0];
		const embed = createEmbed(author);
		if (admin) {
			embed.setDescription(
				"Your guild already has an Admin! use ``guild members`` to view your guild members"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const member = await getGuildMember({ user_id: mentionedUser.id });
		if (!member || member.guild_id !== validGuild.guild.id) {
			embed.setDescription(
				"This User is not in your guild! " +
          "use ``guild invite`` to invite them into your guild!"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		await updateGuildMember({ id: member.id }, {
			is_admin: true,
			is_vice_leader: false 
		});
		const thumb = context.guild?.iconURL() || client.user?.displayAvatarURL();
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setThumbnail(thumb || "")
			.setDescription(
				`Congratulations Summoner ${mentionedUser.username}! ` +
                `You are now the __Admin__ of **${validGuild.guild.name}**`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.promotions.apromote: ERROR",
			err
		);
		return;
	}
};

export const ademote = async ({
	context,
	client,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader", "is_vice_leader" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		const guildDetails = await getGuildDetails({ id: validGuild.guild.id });
		const vice = guildDetails?.filter((g) => g.role === "admin")[0];
		const embed = createEmbed(author);
		if (!vice) {
			embed.setDescription(
				"Your guild does not have an admin! use ``guild vpromote <@user>`` to appoint a Guild Vice Leader."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		await updateGuildMember({ user_id: vice.user_id }, { is_admin: false });
		const thumb = context.guild?.iconURL() || client.user?.displayAvatarURL();
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setThumbnail(thumb || "")
			.setDescription("Your guild Admin has been demoted!");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.promotions.ademote: ERROR",
			err
		);
		return;
	}
};
