import { CharacterCanvasProps } from "@customTypes/canvas";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild } from "api/controllers/GuildsController";
import { getMarriage } from "api/controllers/MarriagesController";
import { getUserRank } from "api/controllers/UserRanksController";
import { getRPGUser } from "api/controllers/UsersController";
import { getZoneByLocationId } from "api/controllers/ZonesController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData, MessageAttachment } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, numericWithComma } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import { DATE_OPTIONS } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

type P = {
  married_to?: string;
  guild?: string | null;
  name?: string;
  filepath?: string;
  itemname?: string;
  zonename?: string;
  rank?: string;
  division?: string;
  wins?: number;
  loss?: number;
  ranked_exp?: string;
  attachment?: MessageAttachment;
  rankic?: string;
  divisionic?: string;
};
export const profile = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const mentionedId = getIdFromMentionedString(args.shift() || "");
		let profileId = author.id;
		if (mentionedId !== "") {
			profileId = mentionedId;
		}
		const clientUser = await client.users.fetch(profileId);
		const user: (UserProps & P) | undefined = await getRPGUser({ user_tag: profileId, });
		if (!user) return;
		user.username = clientUser.username;
		if (user.is_married) {
			const marriage = await getMarriage({ user_tag: user.user_tag });
			if (marriage) {
				const marriedUser = await getRPGUser(
					{ user_tag: marriage.married_to },
					{ cached: true }
				);
				user.married_to = marriedUser?.username;
			}
		}
		const guildMember = await getGuildMember({ user_id: user.id });
		if (guildMember) {
			user.guild = (await getGuild({ id: guildMember.guild_id }))?.name;
		}
		const zone = await getZoneByLocationId({ location_id: user.ruin });
		if (zone) {
			user.zonename = zone.name;
		}
		if (user.selected_card_id) {
			const result = await getCollectionById({
				id: user.selected_card_id,
				user_id: user.id,
				user_tag: user.user_tag,
			});
			if (result) {
				const card = result[0];
				user.itemname = card.itemname;
				user.name = card.name;
				const canvas = await createSingleCanvas(card, false);
				if (canvas) {
					user.attachment = createAttachment(
						canvas.createJPEGStream(),
						"card.jpg"
					);
					user.filepath = "attachment://card.jpg";
				}
			}
		}
		const userRank = await getUserRank({ user_tag: profileId });
		if (userRank) {
			user.wins = userRank.wins;
			user.loss = userRank.loss;
			const rankic = emojiMap(userRank.rank);
			const divisionic = emojiMap(
				`${userRank.rank_id === 5 ? "grand master" : "division"}${
					userRank.division
				}`
			);
			user.rankic = rankic;
			user.divisionic = divisionic;
			user.rank = titleCase(userRank.rank);
			user.division = `${
				userRank.rank_id === 5 ? "Grand Master" : "Division"
			} ${userRank.division}`;
			user.ranked_exp = `[${userRank.exp} / ${userRank.r_exp}]`;
		}
		const embed = createEmbed(clientUser, client)
			.setFields(prepareProfileFields(user))
			.setImage(user.filepath || clientUser.displayAvatarURL())
			.setFooter({
				text: `User ID: ${profileId}`,
				iconURL: clientUser.displayAvatarURL(),
			});

		if (user.attachment) {
			embed.attachFiles([ user.attachment ]);
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.profile.profile(): something went wrong",
			err
		);
		return;
	}
};

function prepareProfileFields(user: UserProps & P) {
	const fields: EmbedFieldData[] = [
		{
			name: `${user.is_premium ? emoji.premium : emoji.shield2} Profile`,
			value: `**${user.username}**`,
			inline: true,
		},
		{
			name: `${emoji.moneybag} Gold`,
			value: numericWithComma(user.gold),
			inline: true,
		},
		{
			name: `${emoji.crossedswords} Level`,
			value: user.level.toString(),
			inline: true,
		},
		{
			name: `${emoji.guildic} Guild`,
			value: user.guild || "None",
			inline: true,
		},
		{
			name: ":card_index: Exp",
			value: `[${user.exp} / ${user.r_exp}] exp`,
			inline: true,
		},
		{
			name: `${emoji.manaic} Mana`,
			value: `[${user.mana} / ${user.max_mana}]`,
			inline: true,
		},
		{
			name: `${emoji.marriageic} Marriage`,
			value: `${
				user.is_married && user.married_to ? user.married_to : "Not Married"
			}`,
			inline: true,
		},
		{
			name: `${emoji.dagger} Selected Card`,
			value: `${titleCase(user.name || "none")}${
				user.itemname ? ` ${emojiMap(user.itemname)}` : ""
			}`,
			inline: true,
		},
		{
			name: `${emoji.permitsic} Raid Permit(s)`,
			value: user.raid_pass.toString(),
			inline: true,
		},
		{
			name: "Floor",
			value: (user.floor || 1).toString(),
			inline: true,
		},
		{
			name: `${emoji.zoneic} Zone`,
			value: user.zonename || "None",
			inline: true,
		},
		{
			name: `${emoji.izzipoints} Izzi Points`,
			value: numericWithComma(user.izzi_points),
			inline: true,
		},
		{
			name: `${emoji.shard} Shards`,
			value: numericWithComma(user.shards),
			inline: true,
		},
		{
			name: `${emoji.blueorb} Blue Orbs`,
			value: numericWithComma(user.orbs),
			inline: true,
		},
		{
			name: ":clock1: Started Playing from",
			value: `${new Date(
				user.created_at
			).toLocaleDateString("en-us", DATE_OPTIONS)}`,
			inline: true
		}
	];

	if (user.rank) {
		fields.push(
			{
				name: `Rank ${user.rankic || ""}`,
				value: user.rank,
				inline: true,
			},
			{
				name: `Division ${user.divisionic || ""}`,
				value: user.division || "",
				inline: true,
			},
			{
				name: "Wins",
				value: user.wins?.toString() || "",
				inline: true,
			},
			{
				name: "Loss",
				value: user.loss?.toString() || "",
				inline: true,
			},
			{
				name: "Ranked Exp",
				value: user.ranked_exp || "",
				inline: true,
			}
		);
	}

	if (user.is_premium) {
		fields.push(
			{
				name: `${emoji.premium} Premium Since`,
				value: new Date(user.premium_since).toLocaleDateString(
					"en-us",
					DATE_OPTIONS
				),
				inline: true,
			},
			{
				name: "Premium Days Left",
				value: user.premium_days_left.toString(),
				inline: true,
			}
		);
	}
	if (user.is_banned) {
		fields.push({
			name: "User Banned :x:",
			value: "You have been Banned",
			inline: true,
		});
	}

	return fields;
}
