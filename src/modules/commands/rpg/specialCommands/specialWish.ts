import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import loggers from "loggers";

export const specialWish = async ({ client, context, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client)
			.setDescription("Hey mommy :heart:! I'm glad you're here. " +
            "I finally got the chance to meet you, Thanks dad haha. I'm so excited to share a lot of things with you!" +
            " Dad always talked about you and how you are his whole universe " +
            "and i just couldn't wait to be with you mom :heart: " +
            "I have so much to tell you and bond with you, making your wishes come true. " +
            "I love you mom :heart: -from your daughter izzi. Oh yeah here's a note from dad and i quote " +
            "``I love you Mia :heart:``. Yeah... i know he gets cheesy sometimes. XD");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("commands.rpg.specialCommands.specialWish(): something went wrong", err);
		return;
	}
};