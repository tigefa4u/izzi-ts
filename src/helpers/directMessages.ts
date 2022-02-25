import { Client, MessageEmbed } from "discord.js";
import loggers from "loggers";

export const DMUser = async (client: Client, content: string | MessageEmbed, authorId: string) => {
	const author = await client.users.fetch(authorId);
	const DM = await author.createDM();
	DM.sendMessage(content).catch((err) => {
		loggers.error("Unable to DM User: " + authorId + " Content: " + JSON.stringify(content), err);
	});
};