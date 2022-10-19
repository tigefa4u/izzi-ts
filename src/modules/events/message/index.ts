import { CommandCategoryProps } from "@customTypes/command";
import { Client, Message } from "discord.js";
import commandCategory from "commandCategories/index";
import { getCommand } from "api/controllers/CommandsController";
import { BOT_PREFIX, DISCORD_CLIENT_ID } from "environment";
import { getIdFromMentionedString, sanitizeArgs } from "helpers";
import { checkUserBanned } from "../checkUserBanned";
import { dropCollectables } from "modules/collectables";
import {
	clearCooldown,
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import loggers from "loggers";
import { MAX_REQUESTS_PER_CHANNEL } from "helpers/constants";
import {
	getChannelCooldown,
	getTTL,
	incrCooldown,
} from "modules/cooldowns/channels";

const ratelimitMap = new Map();

const handleMessage = async (client: Client, context: Message) => {
	try {
		const { content } = context;
		let args = content.toLowerCase().split(/\s+/);
		const botId = getIdFromMentionedString(args[0]);
		// || botId === DISCORD_CLIENT_ID
		if (!(botId === BOT_PREFIX) || !args[1]) {
			if (context.guild?.id) {
				dropCollectables({
					client,
					author: context.author,
					guild: context.guild,
					channel: context.channel,
				});
			}
			return;
		}
		const channelCD = await getChannelCooldown(
			context.channel.id,
			"channel-cd"
		);
		let ttl = await getTTL(context.channel.id, "channel-cd");
		if (ttl < 0) {
			ratelimitMap.delete("rate-limit-" + context.channel.id);
		}
		if (channelCD && channelCD >= MAX_REQUESTS_PER_CHANNEL) {
			if (ttl < 0) {
				clearCooldown(context.channel.id, "channel-cd");
				ttl = 1;
			}
			const messageSent = ratelimitMap.get("rate-limit-" + context.channel.id);
			if (!messageSent) {
				context.channel.sendMessage(
					`Summoner **${context.author.username}**, ` +
				`you are being rate limited for \`\`${ttl} seconds\`\` due to high bot activity`
				);
				ratelimitMap.set("rate-limit-" + context.channel.id, true);
			}
			return;
		}
		const cd = await getCooldown(context.author.id, "command-cd");
		if (cd) {
			sendCommandCDResponse(
				context.channel,
				cd,
				context.author.id,
				"command-cd"
			);
			return;
		}
		const command = await getCommand(args[1]);
		if (!command) return;
		setCooldown(context.author.id, "command-cd", 1);
		args.shift();
		if (
			typeof commandCategory[command?.type as keyof CommandCategoryProps] !==
      "function"
		)
			return;
		if (command.name === "guild" || command.name === "team") {
			args = content.split(/\s+/);
			args.shift();
		}
		const isValid = await checkUserBanned(
			context,
			client,
			context.author,
			command.name
		);
		if (!isValid) return;
		incrCooldown(context.channel.id, "channel-cd", 6);
		commandCategory[command?.type as keyof CommandCategoryProps]({
			client,
			context,
			command,
			args: sanitizeArgs(args),
			options: { author: context.author },
		});
	} catch (err) {
		loggers.error("events.message.handleMessage(): something went wrong", err);
	}
	return;
};

export default handleMessage;
