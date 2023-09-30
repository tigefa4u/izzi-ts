import { Client, Guild, MessageEmbed } from "discord.js";
import { delay } from "helpers";
import loggers from "loggers";
import { getGuildsViaApi } from "server/pipes/directMessage";

export const DMUser = async (
	client: Client,
	content: string | MessageEmbed,
	authorId: string
) => {
	try {
		// temporarily disabled
		await delay(1200);
		const author = await client.users.fetch(authorId);
		const DM = await author.createDM();
		if (content instanceof MessageEmbed) {
			content.setHideConsoleButtons(true);
		}
		DM.sendMessage(content);
	} catch (err) {
		loggers.error(
			"helpers.directMessages.DMUser: Unable to DM User: " +
        authorId +
        " Content: ",
			content,
			err
		);
	}
	return;
};

export const MessageGuildDefaultChannel = async (
	client: Client,
	guildId: string,
	content: string | MessageEmbed
) => {
	try {
		// const guild = await client.guilds.fetch(guildId);
		// const me = guild.me;
		// if (!me) return;
		// let defaultChannel = {} as TextBasedChannel;
		// // finding the channel with send message permissions
		// guild.channels.cache.forEach((channel) => {
		// 	const dfKeys = Object.keys(defaultChannel);
		// 	const channelPerms = channel.permissionsFor(me);
		// 	if (channel.type === "GUILD_TEXT" && dfKeys.length === 0 && 
		// 	channelPerms && channelPerms.has("SEND_MESSAGES") && channelPerms.has("VIEW_CHANNEL")) {
		// 		defaultChannel = channel;
		// 	}
		// });
		// if (content instanceof MessageEmbed) {
		// 	sendChannelMessageViaApi(defaultChannel.id, { embeds: [ content ] });
		// }
		// defaultChannel.sendMessage(content);
		return;
	} catch (err) {
		loggers.error(
			"helpers.directMessages.MessageGuildChannels: Unable to send messages: Content: " +
        	content,
			err
		);
		return;
	}
};

type P = {
  content: string | MessageEmbed;
};
export const PublishMessageToAllGuilds = async ({ content }: P) => {
	try {
		// const guilds = await getGuildsViaApi();
		// console.log({ guilds });
		// const guilds = await getAllGuilds();
		// if (!guilds || guilds.length <= 0) {
		// 	throw new Error("There are no guilds found");
		// }
		// const guilds = (
		// 	await client.shard?.broadcastEval((g) => g.guilds.cache)
		// )?.flat();

		// const len = guilds?.length || 0;
		// console.log("Publishing started...");
		// if (guilds && len > 0) {
		// 	const totalInter = Math.ceil(len / 1000);
		// 	for (let i = 0; i < totalInter; i++) {
		// 		const chunk = guilds.splice(0, 1000);
		// 		await Promise.all(chunk.map((guild) => MessageGuildDefaultChannel(client, guild.id, content)));
		// 		await delay(500);
		// 	}
		// }
		console.log("Publishing completed...");
		return;
	} catch (err) {
		loggers.error(
			"helpers.directMessages.PublishMessageToAllGuilds: ERROR",
			err
		);
		return;
	}
};
