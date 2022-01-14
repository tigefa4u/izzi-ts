import { Client, MessageEmbed } from "discord.js";

export const DMUser = async (client: Client, content: string | MessageEmbed, authorId: string) => {
	const author = await client.users.fetch(authorId);
	const DM = await author.createDM();
	DM.sendMessage(content);
};