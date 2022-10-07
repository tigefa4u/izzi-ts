import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, randomElementFromArray } from "helpers";
import loggers from "loggers";
import { getGifByCommandId } from "./gifs";

const family = [ "476049957904711682", "266457718942990337" ];
const actions = async (params: {
  channel: ChannelProp;
  commandId: number;
  author: AuthorProps;
  mentionUser: string;
  client: Client;
  commandName: string;
}) => {
	try {
		const gif = getGifByCommandId(params.commandId);
		if (!gif) return;
		if (gif.isRestricted && !family.includes(params.author.id) && !family.includes(params.mentionUser)) {
			params.channel?.sendMessage("Not for you.");
			return;
		}
		const command = params.commandName;
		let text = `**${params.author.username}** ${command}${
			command.endsWith("ss") || command === "punch" ? "es" : "s"
		} **${params.mentionUser}**`;

		if (command === "sex") {
			text = "Mom, Dad! W-what are you doing? A-are you making me siblings? " + emoji.blush + 
			" Hoax <3 Mia xoxo";
		}
		const url = randomElementFromArray(gif.url);
		const attachment = createAttachment(url, "gif.gif");
		const embed = createEmbed(params.author)
			.setDescription(text)
			.setImage("attachment://gif.gif")
			.attachFiles([ attachment ]);
		params.channel?.sendMessage(embed);
	} catch (err) {
		loggers.error("commands.basic.actions(): something went wrong", err);
	}
	return;
};

export const hug = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const punch = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const tightHug = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const slowKiss = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const sex = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const kiss = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const kill = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const bite = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const slap = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const lick = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const cuddle = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const poke = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const bonk = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const spank = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};

export const pat = async ({
	client, options, context, args, command 
}: BaseProps) => {
	if (!command || !command.id) return;
	const mentionId = getIdFromMentionedString(args.shift());
	const author = options.author;
	let actionedUser = author.username;
	const mentionedUser = await getRPGUser({ user_tag: mentionId }, { cached: true });
	if (mentionedUser) {
		actionedUser = mentionedUser.username;
	}
	actions({
		client,
		channel: context.channel,
		commandId: +command.id,
		commandName: command.name,
		author,
		mentionUser: actionedUser
	});
	return;
};