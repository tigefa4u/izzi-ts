import { BaseProps } from "@customTypes/command";
import {
	createGuild,
	getGuild,
	updateGuild,
} from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { getMemberPermissions } from "helpers";
import { DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";

export const addGuildEvent = async ({
	context,
	options,
	client,
}: BaseProps) => {
	try {
		context.channel?.sendMessage("Coming soon...");
		return;
	} catch (err) {
		loggers.error("commands.rpg.guildEvents.create.addGuildEvent: ERROR", err);
		return;
	}
};

export const setPrefix = async ({
	context,
	options,
	client,
	args,
}: BaseProps) => {
	try {
		if (!context.guild?.id) return;
		const prefix = args.shift();
		if (!prefix || prefix.length > 5) {
			context.channel?.sendMessage(
				"Prefix must be a valid text between 1 and 5 characters."
			);
			return;
		}
		const author = options.author;
		const isAdmin = await getMemberPermissions(context, options.author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		loggers.info(
			"modules.commands.rpg.guildEvents.actions.setPrefix: validating administrator permissions - ",
			{
        	author,
        	isAdmin,
			}
		);
		if (!isAdmin) {
			context.channel?.sendMessage(
				"You are not allowed to execute this command! :x:"
			);
			return;
		}
		const guild = await getGuild({ guild_id: context.guild.id });
		if (!guild) {
			createGuild({
				guild_id: context.guild.id,
				guild_name: context.guild.name,
				name: null,
				gold: 0,
				guild_level: 0,
				max_members: 15,
				is_active: true,
				prefix,
				is_banned: false,
				is_deleted: false,
				points: 0,
				max_admin_slots: 1,
			});
		} else {
			updateGuild({ guild_id: guild.guild_id }, { prefix });
		}
		loggers.info(
			`modules.commands.rpg.guildEvents.actions.setPrefix: Setting server ${context.guild.id} prefix - ${prefix}`
		);
		Cache.set("prefix::" + context.guild.id, prefix);
		context.channel?.sendMessage(
			`Successfully updated server prefix to **__${prefix}__**. ` +
        `Izzi will now respond to \`\`${prefix} <cmd>\`\` commands ${emoji.celebration}`
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guildEvents.actions.setPrefix: ERROR",
			err
		);
		return;
	}
};
