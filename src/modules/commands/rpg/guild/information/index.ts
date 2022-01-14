import { CharacterStatProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { GuildProps } from "@customTypes/guilds";
import {
	getGuildDetails,
	getTotalMemberAndItemCount,
} from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { verifyMemberPermissions } from "..";

type P = {
  username: string;
  user_tag: string;
};
function prepareGuildDesc(
	leader: P,
	guild: GuildProps,
	mc: number,
	ic: number,
	stats: Omit<CharacterStatProps, "precision" | "accuracy" | "evasion" | "critical">,
	vice?: P
) {
	const desc = `All your clan stats are shown below!\n**Clan Leader:** ${
		leader.username
	}${vice ? `\n**Clan Vice Leader:** ${vice.username}` : ""}\n**Clan Name:** ${
		guild.name
	}\n**Clan Level:** ${guild.guild_level}\n**Clan Gold:** ${
		guild.gold
	}\n**Clan Members:** __${mc}/${
		guild.max_members
	}__\n**Clan Items:** __${ic}__\n\n**Clan Bonus Stats** ${emoji.up}\n\n${
		emoji.crossedswords
	} **Bonus ATK:** (+___${stats.vitality}__)\n${
		emoji.heart
	} **Bonus HP:** (+__${stats.strength}__)\n${
		emoji.shield
	} **Bonus DEF:** (+__${stats.defense}__)\n${emoji.dash} **Bonus SPD:** (+__${
		stats.dexterity
	}__)\n${emoji.radiobutton} **Bonus INT:** (+__${stats.intelligence}__)`;

	return desc;
}

export const viewGuild = async ({ context, options }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
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
		const leader = guildDetails.filter((g) => g.role === "leader")[0];
		if (!leader) {
			context.channel?.sendMessage(
				"Oh no, your guild is without a Leader. Please contact support!"
			);
			return;
		}
		const vice = guildDetails.filter((g) => g.role === "vice_leader")[0];
		const totalCount = await getTotalMemberAndItemCount({ id: validGuild.guild.id, });
		const memberCount = totalCount?.filter((t) => t.type === "members")[0];
		const itemCount = totalCount?.filter((t) => t.type === "items")[0];
		const stats = validGuild.guild.guild_stats;
		if (!stats) return;
		const embed = createEmbed()
			.setTitle(
				`${emoji.beginner} ${
					validGuild.guild.name || validGuild.guild.guild_name
				}`
			)
			.setDescription(
				prepareGuildDesc(
					leader,
					validGuild.guild,
					memberCount?.count || 0,
					itemCount?.count || 0,
					stats,
					vice
				)
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