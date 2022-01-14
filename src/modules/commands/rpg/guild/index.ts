import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { GuildMemberProps } from "@customTypes/guildMembers";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild } from "api/controllers/GuildsController";
import { createEmbed } from "commons/embeds";
import { MessageEmbed } from "discord.js";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { addGuild, renameGuild, setBanner } from "./actions";
import { inviteToGuild } from "./actions/invite";
import { disbandGuild, leaveGuild } from "./dangerZone";
import { kickFromGuild } from "./dangerZone/kick";
import { donateToGuild } from "./donations";
import { viewGuild } from "./information";
import { viewMembers } from "./information/members";
import { guildItems } from "./items";
import { vdemote, vpromote } from "./promotions";
import { itemMarket } from "./shop";
import { subcommands } from "./subcommands";

export const guild = async ({ context, client, args, options }: BaseProps) => {
	try {
		const subcommand = filterSubCommands(args.shift() || "view", subcommands);
		const params = {
			context,
			client,
			options,
			args,
		};
		if (subcommand === "create") {
			addGuild(params);
		} else if (subcommand === "view") {
			viewGuild(params);
		} else if (subcommand === "disband") {
			disbandGuild(params);
		} else if (subcommand === "rename") {
			renameGuild(params);
		} else if (subcommand === "banner") {
			setBanner(params);
		} else if (subcommand === "members") {
			viewMembers(params);
		} else if (subcommand === "leave") {
			leaveGuild(params);
		} else if (subcommand === "invite") {
			inviteToGuild(params);
		} else if (subcommand === "vpromote") {
			vpromote(params);
		} else if (subcommand === "vdemote") {
			vdemote(params);
		} else if (subcommand === "kick") {
			kickFromGuild(params);
		} else if (subcommand === "items") {
			guildItems(params);
		} else if (subcommand === "market") {
			itemMarket(params);
		} else if (subcommand === "donate") {
			donateToGuild(params);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.guild(): something went wrong",
			err
		);
		return;
	}
};

type P = "is_leader" | "is_vice_leader";
async function validateGuildMember(
	id: number,
	username: string,
	embed: MessageEmbed,
	channel: ChannelProp
) {
	const guildMember = await getGuildMember({ user_id: id });
	if (!guildMember) {
		embed.setDescription(
			`Summoner **${username}** is currently not in a guild!`
		);
		channel?.sendMessage(embed);
		return;
	}
	return guildMember;
}

async function validateGuild(
	id: number,
	username: string,
	isOriginServer: boolean,
	channel: ChannelProp,
	context_guild_id: string
) {
	const guild = await getGuild({ id: id });
	if (guild?.guild_id !== context_guild_id && isOriginServer === true) {
		channel?.sendMessage(
			`Summoner **${username}**, you need to be in your guild server to use this command!`
		);
		return;
	}
	return guild;
}

function validateFlag(params: P[], isAdmin: boolean, member: GuildMemberProps, channel: ChannelProp) {
	let flag = false;
	for (const key of params) {
		flag = member[key];
		if (flag) {
			break;
		}
	}
	if (flag === false && isAdmin === true) {
		channel?.sendMessage(
			"You are not allowed to execute this command!"
		);
		return;
	}
	return {};
}

export const verifyMemberPermissions = async (params: {
  context: BaseProps["context"];
  author: AuthorProps;
  params: P[];
  isOriginServer: boolean;
  isAdmin: boolean;
  extras: { user_id: number };
}) => {
	try {
		if (!params.context.guild?.id) return;
		const embed = createEmbed(params.author).setTitle(DEFAULT_ERROR_TITLE);
		const member = await validateGuildMember(
			params.extras.user_id,
			params.author.username,
			embed,
			params.context.channel
		);
		if (!member) return;
		const guild = await validateGuild(
			member.guild_id,
			params.author.username,
			params.isOriginServer,
			params.context.channel,
			params.context.guild.id
		);
		if (!guild) return;
		const flag = validateFlag(params.params, params.isAdmin, member, params.context.channel);
		if (!flag) return;
		return {
			guild,
			member 
		};
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.verifyMemberPermissions(): something went wrong",
			err
		);
		return;
	}
};
