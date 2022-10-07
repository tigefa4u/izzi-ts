import { CharacterStatProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { GuildProps, GuildStatProps } from "@customTypes/guilds";
import {
	getGuildDetails,
	getTotalMemberAndItemCount,
} from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, numericWithComma } from "helpers";
import loggers from "loggers";
import { isEmptyValue } from "utility";
import { verifyMemberPermissions } from "..";

type P = {
  username: string;
  user_tag: string;
};

function prepareItemBonusDesc(stats: GuildStatProps) {
	if (!stats || isEmptyValue(stats)) return "";
	const desc =
    `\n\n**Clan Bonus Item Stats ${emoji.up}**` +
    `\n\n${emoji.crossedswords} **Bonus ATK:** (+__${stats.vitality}__)` +
    `\n${emoji.heart} **Bonus HP:** (+__${stats.strength}__)` +
    `\n${emoji.shield} **Bonus DEF:** (+__${stats.defense}__)` +
    `\n${emoji.dash} **Bonus SPD:** (+__${stats.dexterity}__)` +
    `\n${emoji.radiobutton} **Bonus INT:** (+__${stats.intelligence}__)`;

	return desc;
}

function prepareGuildDesc(
	leader: P,
	guild: GuildProps,
	mc: number,
	ic: number,
	stats: Omit<
    CharacterStatProps,
    "precision" | "accuracy" | "evasion" | "critical"
  >,
	vice?: P,
	admin?: P
) {
	const desc = `All your clan stats are shown below!\n**Clan Leader:** ${
		leader.username
	}${vice ? `\n**Clan Vice Leader:** ${vice.username}` : ""}${
		admin ? `\n**Clan Admin:** ${admin.username}` : ""
	}\n**Clan Name:** ${guild.name}\n**Clan Level:** ${
		guild.guild_level
	}\n**Clan Reputation:** ${guild.points}\n**Clan Gold:** ${numericWithComma(
		guild.gold
	)} ${emoji.gold}\n**Clan Members:** __${mc}/${
		guild.max_members
	}__\n**Clan Items:** __${ic}__\n\n**Clan Bonus Stats** ${emoji.up}\n\n${
		emoji.crossedswords
	} **Bonus ATK:** (+__${stats.vitality}__)\n${emoji.heart} **Bonus HP:** (+__${
		stats.strength
	}__)\n${emoji.shield} **Bonus DEF:** (+__${stats.defense}__)\n${
		emoji.dash
	} **Bonus SPD:** (+__${stats.dexterity}__)\n${
		emoji.radiobutton
	} **Bonus INT:** (+__${stats.intelligence}__)${prepareItemBonusDesc(
		guild.item_stats
	)}`;

	return desc;
}

export const viewGuild = async ({ context, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const mentionedId = getIdFromMentionedString(args.shift() || "");
		let userId = author.id;
		if (mentionedId !== "") {
			userId = mentionedId;
		}
		const user = await getRPGUser({ user_tag: userId }, { cached: true });
		if (!user) return;
		const validGuild = await verifyMemberPermissions({
			context,
			author,
			params: [],
			isOriginServer: false,
			isAdmin: false,
			extras: { user_id: user.id },
		});
		if (!validGuild) return;
		const guildDetails = await getGuildDetails({ id: validGuild.guild.id });
		if (!guildDetails) return;
		const leader = guildDetails.find((g) => g.role === "leader");
		if (!leader) {
			loggers.error(
				`Not able to find Guild details for ID: ${validGuild.guild.id} from guild_details view`,
				{}
			);
			context.channel?.sendMessage(
				"Oh no, your guild is without a Leader. Please contact support!"
			);
			return;
		}
		const vice = guildDetails.find((g) => g.role === "vice_leader");
		const admin = guildDetails.find((g) => g.role === "admin");
		const totalCount = await getTotalMemberAndItemCount({ id: validGuild.guild.id, });
		const memberCount = totalCount?.filter((t) => t.type === "members")[0];
		const itemCount = totalCount?.filter((t) => t.type === "items")[0];
		const stats = validGuild.guild.guild_stats;
		if (!stats) return;

		const guildMeta = validGuild.guild.metadata as any;

		const embed = createEmbed()
			.setTitle(
				`${emoji.beginner} ${
					validGuild.guild.name || validGuild.guild.guild_name
				}`
			)
			.setDescription(
				`${emoji.chat} ${
					guildMeta?.status ||
          "Use ``iz guild status <text>`` to set guild status."
				}\n\n${prepareGuildDesc(
					leader,
					validGuild.guild,
					memberCount?.count || 0,
					itemCount?.count || 0,
					stats,
					vice,
					admin
				)}`
			);
		if (validGuild.guild.banner) {
			embed.setImage(validGuild.guild.banner);
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.information.viewGuild(): something went wrong",
			err
		);
		return;
	}
};
