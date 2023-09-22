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
		loggers.error("api.controllers.GuildsController.getGuild: ERROR", err);
		return;
	}
};

export const getGuildByGuildIds = async (guild_ids: string[]) => {
	try {
		return Guilds.getByGuildIds(guild_ids);
	} catch (err) {
		loggers.error("GuildsController.getGuildByGuildIds: ERROR", err);
		return;
	}
};

export const updateGuild = async (params: GuildParams, data: GuildUpdateProps) => {
	try {
		loggers.info("api.controllers.GuildsController.updateGuild: updating guild => ", {
			data,
			params
		});
		return Guilds.update(params, data);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.updateGuild: ERROR", err);
		return;
	}
};

export const deleGuild = async (params: { id: number }) => {
	try {
		loggers.info("api.controllers.GuildsController.deleGuild: deleting guild with id -> " + params.id);
		return Guilds.del(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.delGuild: ERROR", err);
		return;
	}
};

export const createGuild = async (data: GuildCreateProps) => {
	try {
		loggers.info("Creating new Guild with: ", data);
		return Guilds.create(data);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.createGuild: ERROR", err);
		return;
	}
};

export const getGuildDetails = async (params: { id: number }) => {
	try {
		return Guilds.getDetails(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getGuildDetails: ERROR", err);
		return;
	}
};

export const getTotalMemberAndItemCount = async (params: { id: number }) => {
	try {
		return Guilds.getMemberAndItemCount(params);
	} catch (err) {
		loggers.error("api.controllers.GuildsController.getTotalMemberAndItemCount: ERROR", err);
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
			is_banned: guild.is_banned,
			max_members: guild.max_members,
		};
		loggers.info("Disbanding guild with guild ID: ", {
			guildId: guild.guild_id,
			guild
		});
		return Promise.all([ delAllGuildMembers({ guild_id: guild.id }),
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
		loggers.error("controllers.GuildsController.disbandGuild: Unable to delete guild", err);
		return;
	}
};

export const getAllGuilds = async () => {
	try {
		return Guilds.getAll();
	} catch (err) {
		loggers.error("controllers.GuildsController.getAllGuilds: ERROR", err);
		return;
	}
};

export const increaseGuildMMR = async (params: {
	id: number;
	mmr: number;
}) => {
	try {
		return Guilds.updateMMR(params, "inc");
	} catch (err) {
		loggers.error("GuildsController.increaseGuildMMR: ERROR", err);
	}
};

export const decreaseGuildMMR = async (params: {
	id: number;
	mmr: number;
}) => {
	try {
		return Guilds.updateMMR(params, "dec");
	} catch (err) {
		loggers.error("GuildsController.decreaseGuildMMR: ERROR", err);
	}
};