import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import loggers from "loggers";

export const makeAWishHelp = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client).setTitle("Make A Wish (wish help)")
			.setDescription("**All the commands available on make a wish**\n\n**sort <args>**\n" + 
            "Example ``sort -i -asc/-desc`` -> Sort your inventory by ID.\nExample ``sort reset`` -> Reset sorting" + 
            "\n\n**chl <ID> <level>**\nSet a character level for a card (Hoax only)." +
            "\n\n**chr <ID> <rank>**\nSet a character rank for a card (Hoax only)." +
            "\n\n**rdmg <raidID> <userID> <damage>**\nHack raid damage (Hoax only).");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("specialCommands.help.makeAWishHelp(): something went wrong", err);
		return;
	}
};