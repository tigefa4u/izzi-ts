import { Client, MessageEmbed } from "discord.js";
import { delay } from "helpers";
import loggers from "loggers";

export const DMUser = async (
	client: Client,
	content: string | MessageEmbed,
	authorId: string
) => {
	try {
		// temporarily disabled
		return true;
		// await delay(1200);
		// const author = await client.users.fetch(authorId);
		// const DM = await author.createDM();
		// DM.sendMessage(content);
	} catch (err) {
		loggers.error(
			"helpers.directMessages.DMUser(): Unable to DM User: " +
        authorId +
        " Content: " +
        JSON.stringify(content),
			err
		);
	}
	return;
};
