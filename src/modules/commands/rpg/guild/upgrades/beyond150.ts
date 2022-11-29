import { AuthorProps, ChannelProp, ResponseWithPagination } from "@customTypes";
import { CharacterStatProps } from "@customTypes/characters";
import { GuildItemResponseProps } from "@customTypes/guildItems";
import { GuildMemberProps } from "@customTypes/guildMembers";
import { GuildProps, GuildStatProps } from "@customTypes/guilds";
import {
	delGuildItems,
	updateGuildItem,
} from "api/controllers/GuildItemsController";
import { updateGuild } from "api/controllers/GuildsController";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import e from "express";
import { statRelationMap } from "helpers/ability";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	GUILD_MAX_LEVEL,
	IMMORTAL_SHIELDBOW_ID,
} from "helpers/constants";
import loggers from "loggers";

type UB = {
  guilditems: ResponseWithPagination<GuildItemResponseProps[]> | undefined;
  author: AuthorProps;
  validGuild: {
    guild: GuildProps;
    member: GuildMemberProps;
  };
  isConfirm?: boolean;
  client: Client;
  channel: ChannelProp;
  statToUpgrade: Omit<
    keyof CharacterStatProps,
    "evasion" | "accuracy" | "critical" | "precision"
  >;
};
export const upgradeGuildBeyond150 = async ({
	guilditems,
	author,
	validGuild,
	client,
	channel,
	statToUpgrade,
	isConfirm,
}: UB) => {
	try {
		if (!guilditems || !validGuild.guild.guild_stats) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const shieldBow = guilditems.data.find(
			(d) => d.item_id === IMMORTAL_SHIELDBOW_ID
		);
		if (!shieldBow) {
			embed.setDescription(
				"Your guild does not have the special item **Immortal Shieldbow** to upgrade guild"
			);
			channel?.sendMessage(embed);
			return;
		}
		const nextLevel = validGuild.guild.guild_level + 1;
		const diff = nextLevel - GUILD_MAX_LEVEL;
		const reqItems = (diff - 1) * 2;
		if (shieldBow.quantity < reqItems) {
			embed.setDescription(
				"Your guild does not have sufficient **Immortal Shieldbows** " +
          `to upgrade **__[${shieldBow.quantity} / ${reqItems}]__**`
			);
			channel?.sendMessage(embed);
			return;
		}
		if (isConfirm) {
			shieldBow.quantity = shieldBow.quantity - reqItems;
			if (shieldBow.quantity <= 0) {
				await delGuildItems({
					guild_id: validGuild.guild.id,
					id: shieldBow.id,
				});
			} else {
				await updateGuildItem(
					{ id: shieldBow.id },
					{ quantity: shieldBow.quantity }
				);
			}
			validGuild.guild.guild_level = nextLevel;
			const incVal =
        validGuild.guild.guild_stats[statToUpgrade as keyof GuildStatProps] +
        0.1;

			Object.assign(validGuild.guild.guild_stats, {
				[statToUpgrade as any]:
          Math.round((incVal + Number.EPSILON) * 100) / 100,
			});
			loggers.info("guilds.upgrades.beyond150.upgradeGuildBeyond150: upgrading guild with data -> " + 
            JSON.stringify(validGuild.guild));
			await updateGuild({ id: validGuild.guild.id }, {
				guild_level: validGuild.guild.guild_level,
				guild_stats: validGuild.guild.guild_stats
			});

			embed
				.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription(
					"Congratulations Summoner! you have successfully consumed " +
                    `__${reqItems}x__ **Immortal Shieldbow** ` +
          "and increased your guild level to " +
          `**level __${validGuild.guild.guild_level}__** ` +
          `as well as increasing **__${statRelationMap[statToUpgrade as any]}__** bonus stats!`
				);

			channel?.sendMessage(embed);
			return;
		}
		return {
			shieldBows: reqItems,
			statToUpgrade: statRelationMap[statToUpgrade as any] 
		};
	} catch (err) {
		loggers.error(
			"guilds.upgrades.beyond150.upgradeGuildBeyond150: ERROR",
			err
		);
		return;
	}
};
