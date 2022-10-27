import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import { randomElementFromArray } from "helpers";
import loggers from "loggers";
import { getGifByCommandId } from "./gifs";

const emotions = async (params: { channel: ChannelProp; commandId: number; client: Client; author: AuthorProps; }) => {
	try {
		const gif = getGifByCommandId(params.commandId);
		if (!gif) return;
		const url = randomElementFromArray(gif.url);
		const attachment = createAttachment(url, "gif.gif");
		const embed = createEmbed(params.author)
			.setImage("attachment://gif.gif")
			.attachFiles([ attachment ])
			.setHideConsoleButtons(true);
		params.channel?.sendMessage(embed);
	} catch (err) {
		loggers.error("commands.basic.emotions: ERROR", err);
	}
	return;
};

export const glare = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};

export const laugh = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};

export const pout = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};

export const baka = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};

export const run = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};

export const dodge = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};

export const dance = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};

export const cry = async ({
	client, context, args, command, options 
}: BaseProps) => {
	if (!command?.id) return;
	emotions({
		channel: context.channel,
		commandId: +command.id,
		client,
		author: options.author
	});
	return;
};
