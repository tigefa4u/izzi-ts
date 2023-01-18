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
import { createUserBlacklist, getUserBlacklist, updateUserBlacklist } from "api/controllers/UserBlacklistsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { BOT_PREFIX, OWNER_DISCORDID } from "environment";
import { getMemberPermissions, numericWithComma } from "helpers";
import {
	BANNED_TERMS,
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	GUILD_BASE_STATS,
	GUILD_CREATION_COST,
	GUILD_STATUS_MAX_LENGTH,
	INPUT_CHARACTERS_MAX_COUNT,
} from "helpers/constants";
import loggers from "loggers";
import { verifyMemberPermissions } from "..";

export const addGuild = async ({
	context,
	args,
	options,
	client,
}: BaseProps) => {
	try {
		if (!context.guild || !OWNER_DISCORDID) return;
		const author = options.author;
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
		if (BANNED_TERMS.includes(name.toLowerCase())) {
			context.channel?.sendMessage(`Summoner **${author.username}**, You have been blacklisted for ` +
			"using a banned term.");
			const blackList = await getUserBlacklist({ user_tag: author.id });
			if (blackList && blackList.length > 0) {
				await updateUserBlacklist({ user_tag: author.id }, {
					reason: "creating inappropriate guild names",
					offense: blackList[0].offense + 1,
					metadata: {
						pastOffenses: [
							...blackList[0].metadata.pastOffenses,
							blackList[0].reason
						]
					}
				});
			} else {
				await createUserBlacklist({
					user_tag: author.id,
					username: author.username,
					reason: "creating inappropriate guild names",
					offense: 1,
					metadata: {}
				});
			}
			return;
		}
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
				max_members: 15,
				guild_level: 0,
				is_banned: false,
				is_deleted: false,
				max_admin_slots: 1
			});
			return;
		}
		const embed = createEmbed(options.author, client).setTitle(
			DEFAULT_ERROR_TITLE
		);
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
          "use ``guild invite <@user>`` to invite others to join your guild! " +
          "\n**Disclaimer: If izzi bot is kicked from the server or if the server " +
		  "is deleted your guild will be auto deleted losing all of your guild bonus stats and gold**"
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

		const promises = [
			updateRPGUser({ user_tag: user.user_tag }, { gold: user.gold }),
			updateRPGUser({ user_tag: owner.user_tag }, { gold: owner.gold }),
			updateGuild(
				{ id: guildExist.id },
				{
					gold: initialDonation,
					guild_stats: GUILD_BASE_STATS,
					guild_level: 1,
					max_members: 15,
					name,
				}
			),
			createGuildMember({
				guild_id: guildExist.id,
				user_id: user.id,
				is_leader: true,
				donation: initialDonation,
				max_donation: initialDonation,
				is_vice_leader: false,
				is_admin: false,
				supporter_points: 0
			}),
		];

		await Promise.all(promises);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				"Congratulations! You have successfully created your guild, " +
          "you can now invite members into your guild using " +
          "``guild invite <@user>``. " +
          `Your guild has also been awarded __${numericWithComma(initialDonation)}__ Gold ${emoji.gold}`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.createGuild: ERROR",
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
		const author = options.author;
		if (BANNED_TERMS.includes(name.toLowerCase())) {
			context.channel?.sendMessage(`Summoner **${author.username}**, You have been blacklisted for ` +
			"using a banned term.");
			const blackList = await getUserBlacklist({ user_tag: author.id });
			if (blackList && blackList.length > 0) {
				await updateUserBlacklist({ user_tag: author.id }, {
					reason: "creating inappropriate guild re-names",
					offense: blackList[0].offense + 1,
					metadata: {
						pastOffenses: [
							...blackList[0].metadata.pastOffenses,
							blackList[0].reason
						]
					}
				});
			} else {
				await createUserBlacklist({
					user_tag: author.id,
					username: author.username,
					reason: "creating inappropriate guild re-names",
					offense: 1,
					metadata: {}
				});
			}
			return;
		}
		const user = await getRPGUser(
			{ user_tag: options.author.id },
			{ cached: true }
		);
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author: options.author,
			params: [ "is_leader", "is_vice_leader" ],
			isOriginServer: true,
			isAdmin: false,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		await updateGuild({ id: validGuild.guild.id }, { name });
		context.channel?.sendMessage(
			`Successfully rename **${validGuild.guild.name}** to **__${name}__**`
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.renameGuild: ERROR",
			err
		);
		return;
	}
};

export const setBanner = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const url = args.shift();
		if (!url || !url.startsWith("https") || url.length > 225) {
			context.channel?.sendMessage(
				"Invalid url provided (urls must start with ``https://``)"
			);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader", "is_vice_leader", "is_admin" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		await updateGuild({ id: validGuild.guild.id }, { banner: url });
		const thumbnail =
      context.guild?.iconURL() || client.user?.displayAvatarURL();
		const embed = createEmbed(author)
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setThumbnail(thumbnail || "")
			.setDescription("Successfully set Clan Banner!");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.setBanner: ERROR",
			err
		);
		return;
	}
};

export const setGuildStatus = async ({ context, options }: BaseProps) => {
	try {
		const author = options.author;
		const status = context.content.split("status")[1]?.trim() || "";
		if (!status || status === "") return;
		if (status.length > GUILD_STATUS_MAX_LENGTH) {
			context.channel?.sendMessage(`Summoner **${author.username}**, ` +
			`Status text should not be more than __${GUILD_STATUS_MAX_LENGTH}__ letters.`);
			return;
		}
		if (BANNED_TERMS.includes(status.toLowerCase())) {
			context.channel?.sendMessage(`Summoner **${author.username}**, You have been blacklisted for ` +
			"using a banned term.");
			const blackList = await getUserBlacklist({ user_tag: author.id });
			if (blackList && blackList.length > 0) {
				await updateUserBlacklist({ user_tag: author.id }, {
					reason: "creating inappropriate guild status",
					offense: blackList[0].offense + 1,
					metadata: {
						pastOffenses: [
							...blackList[0].metadata.pastOffenses,
							blackList[0].reason
						]
					}
				});
			} else {
				await createUserBlacklist({
					user_tag: author.id,
					username: author.username,
					reason: "creating inappropriate guild status",
					offense: 1,
					metadata: {}
				});
			}
			return;
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [ "is_leader", "is_vice_leader", "is_admin" ],
			isOriginServer: true,
			isAdmin: true,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		await updateGuild({ guild_id: validGuild.guild.guild_id }, {
			metadata: JSON.stringify({
				...validGuild.guild.metadata as any,
				status
			})
		});
		context.channel?.sendMessage("Successfully updated Guild status.");
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.actions.setGuildStatus: ERROR",
			err
		);
		return;
	}
};
