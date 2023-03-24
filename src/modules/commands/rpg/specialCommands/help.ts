import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import loggers from "loggers";

export const makeAWishHelp = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client).setTitle("Make A Wish (wish help)")
			.setDescription("**All the commands available on make a wish**\n\n**sort <args>**\n" + 
            "Example ``sort -i -asc/-desc`` -> Sort your inventory by ID.\nExample ``sort reset`` -> Reset sorting" + 
			"\n\n**re**\nRefills raid energy." +
			"\n\n**chl <ID> <level>**\nSet a character level for a card (Hoax only)." +
            "\n\n**chr <ID> <rank>**\nSet a character rank for a card (Hoax only)." +
            "\n\n**rdmg <raidID> <userID> <damage>**\nHack raid damage (Hoax only)." +
			"\n\n**wspawn**\nSpawn World boss (Hoax only)." +
			"\n\n**wend**\nForce Finish the World Boss (Hoax only)." +
			"\n\n**wstart**\nStart World Boss Challenge (Hoax only)." +
			"\n\n**wdmg <damage>**\nHack World Boss HP (Hoax only).");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("specialCommands.help.makeAWishHelp: ERROR", err);
		return;
	}
};