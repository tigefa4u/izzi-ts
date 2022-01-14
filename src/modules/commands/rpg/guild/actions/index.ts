import { BaseProps } from "@customTypes/command";
import {
	createGuildMember,
	getGuildMember,
} from "api/controllers/GuildMembersController";
import {
	createGuild,
	getGuild,
	updateGuild,
} from "api/controllers/GuildsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { BOT_PREFIX, OWNER_DISCORDID } from "environment";
import { getMemberPermissions } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	GUILD_BASE_STATS,
	GUILD_CREATION_COST,
	INPUT_CHARACTERS_MAX_COUNT,
} from "helpers/constants";
import loggers from "loggers";
import { verifyMemberPermissions } from "..";

export const addGuild = async ({ context, args, options, client }: BaseProps) => {
	try {
		if (!context.guild || !OWNER_DISCORDID) return;
		const isAdmin = await getMemberPermissions(context, options.author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		if (!isAdmin) {
			context.channel?.sendMessage(
				"You are not allowed to execute this command! :x:"
			);
			return;
		}
		const name = args.join(" ");
		if (!name || name.length > INPUT_CHARACTERS_MAX_COUNT) return;
		const guildExist = await getGuild({ guild_id: context.guild.id });
		if (!guildExist) {
			context.channel?.sendMessage("Oh no! error occured. Please try again");
			await createGuild({
				gold: 0,
				guild_id: context.guild.id,
				guild_name: context.guild.name,
				points: 0,
				prefix: BOT_PREFIX,
				is_active: true,
			});
			return;
		}
		const embed = createEmbed(options.author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (guildExist.name) {
			embed.setDescription("A Guild already exists on this server");
			context.channel?.sendMessage(embed);
			return;
		}
		const user = await getRPGUser({ user_tag: options.author.id });
		if (!user) return;
		const guildMember = await getGuildMember({ user_id: user.id });
		if (guildMember) {
			embed.setDescription(
				"Summoner, You have already created your guild! " +
          "use ``guild invite <@user>`` to invite others to join your guild!"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.gold < GUILD_CREATION_COST) {
			embed.setDescription("You do not have sufficient gold to create a guild");
			context.channel?.sendMessage(embed);
			return;
		}
		const owner = await getRPGUser({ user_tag: OWNER_DISCORDID });
		if (!owner) return;
		const initialDonation = 100000;
		user.gold = user.gold - GUILD_CREATION_COST;
		owner.gold = owner.gold + initialDonation;
		await updateRPGUser({ user_tag: user.user_tag }, { gold: user.gold });
		await updateRPGUser({ user_tag: owner.user_tag }, { gold: owner.gold });
		await updateGuild(
			{ id: guildExist.id },
			{
				gold: initialDonation,
				guild_stats: GUILD_BASE_STATS,
				guild_level: 1,
				max_members: 15,
				name,
			}
		);
		await createGuildMember({
			guild_id: guildExist.id,
			user_id: user.id,
			is_leader: true,
			donation: initialDonation,
			max_donation: initialDonation,
			is_vice_leader: false,
		});
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				"Congratulations! You have successfully created your guild, " +
                "you can now invite members into your guild using " +
                "``guild invite <@user>``. " +
                `Your guild has also been awarded __${initialDonation}__ Gold ${emoji.gold}`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.createGuild(): something went wrong",
			err
		);
		return;
	}
};

export const renameGuild = async ({ context, args, options }: BaseProps) => {
	try {
		const isAdmin = await getMemberPermissions(context, options.author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		if (!isAdmin) {
			context.channel?.sendMessage(
				"You are not allowed to execute this command! :x:"
			);
			return;
		}
		const name = args.join(" ");
		if (!name || name.length > 20) return;
		const user = await getRPGUser({ user_tag: options.author.id });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author: options.author,
			params: [ "is_leader", "is_vice_leader" ],
			isOriginServer: true,
			isAdmin: false,
			extras: { user_id: user.id }
		});
		if (!validGuild) return;
		await updateGuild({ id: validGuild.guild.id }, { name });
		context.channel?.sendMessage(`Successfully rename **${validGuild.guild.name}** to **__${name}__**`);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.renameGuild(): something went wrong",
			err
		);
		return;
	}
};

export const setBanner = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const url = args.shift();
		if (!url || !url.startsWith("https") || url.length > 225) {
			context.channel?.sendMessage("Invalid url provided (urls must start with ``https://``)");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader", "is_vice_leader" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id }
		});
		if (!validGuild) return;
		await updateGuild({ id: validGuild.guild.id }, { banner: url });
		const thumbnail = context.guild?.iconURL() || client.user?.displayAvatarURL();
		const embed = createEmbed()
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setAuthor({
				name: author.username,
				iconURL: author.displayAvatarURL()
			})
			.setThumbnail(thumbnail || "")
			.setDescription("Successfully set Clan Banner!");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.setBanner(): something went wrong",
			err
		);
		return;
	}
};