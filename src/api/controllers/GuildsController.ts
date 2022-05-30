import { GuildCreateProps, GuildParams, GuildProps, GuildUpdateProps } from "@customTypes/guilds";
import loggers from "loggers";
import * as Guilds from "../models/Guilds";
import { delGuildItems } from "./GuildItemsController";
import { delAllGuildMembers } from "./GuildMembersController";

export const getGuild = async (params: GuildParams) => {
	try {
		const result = await Guilds.get(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getGuild(): something went wrong", err);
		return;
	}
};

export const updateGuild = async (params: GuildParams, data: GuildUpdateProps) => {
	try {
		return await Guilds.update(params, data);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.updateGuild(): something went wrong", err);
		return;
	}
};

export const deleGuild = async (params: { id: number }) => {
	try {
		return await Guilds.del(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.delGuild(): something went wrong", err);
		return;
	}
};

export const createGuild = async (data: GuildCreateProps) => {
	try {
		loggers.info("Creating new Guild with: " + JSON.stringify(data));
		return await Guilds.create(data);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.createGuild(): something went wrong", err);
		return;
	}
};

export const getGuildDetails = async (params: { id: number }) => {
	try {
		return await Guilds.getDetails(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getGuildDetails(): something went wrong", err);
		return;
	}
};

export const getTotalMemberAndItemCount = async (params: { id: number }) => {
	try {
		return await Guilds.getMemberAndItemCount(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getTotalMemberAndItemCount(): something went wrong", err);
		return;
	}
};

export const disbandAndBackupGuild = async ({ guild }: { guild: GuildProps; }) => {
	try {
		const guildbackUp = {
			guild_stats: guild.guild_stats,
			guild_name: guild.guild_name,
			item_stats: guild.item_stats,
			guild_level: guild.guild_level,
			gold: guild.gold,
			ban_reason: guild.ban_reason,
			is_banned: guild.is_banned
		};
		loggers.info("Disbanding guild with guild ID: " + guild.guild_id + " details -> " + JSON.stringify(guild));
		await Promise.all([ delAllGuildMembers({ guild_id: guild.id }),
			delGuildItems({ guild_id: guild.id }),
			updateGuild(
				{ id: guild.id },
				{
					gold: 0,
					guild_stats: null,
					metadata: JSON.stringify(guildbackUp),
					guild_level: 0,
					name: null,
					points: 0,
					item_stats: null
				}
			) ]);
	} catch (err) {
		loggers.error("controllers.GuildsController.disbandGuild(): Unable to delete guild", err);
		return;
	}
};