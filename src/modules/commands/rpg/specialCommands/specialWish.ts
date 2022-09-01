import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { randomElementFromArray } from "helpers";
import loggers from "loggers";
import { clearCooldown, getCooldown } from "modules/cooldowns";
import { links } from "./links";

const WISHES = {
	spawnReset: "raid-spawn-reset",
	love: "love",
	song: "song"
};

export const specialWish = async ({ client, context, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const wishes = [ WISHES.spawnReset, WISHES.love ];
		const wish = randomElementFromArray(wishes);
		const embed = createEmbed(author, client);

		switch (wish) {
			case WISHES.spawnReset: {
				const cd = await getCooldown(author.id, "raid-spawn");
				if (cd) {
					await clearCooldown(author.id, "raid-spawn");
					embed.setDescription("Hey mom :heart:, glad to see you again. I've noticed you've been " +
                    "struggling with the raid spawn timer. " +
                    "oof yeah i know it can be frustrating sometimes when " +
                    "I can't raid with you, hehe. We both hate waiting! " +
                    "Dad should know better! " +
                    "Anyways I've cleared the raid spawn timer for your mommy, " +
                    "go ahead and try spawning another raid.");
				} else {
					embed.setDescription(`Oh hey mom ${emoji.sleepy}, I'm kinda sleepy at the moment and ` +
                    "can't play with you right now, come back another time. Love you mom.");
				}

				context.channel?.sendMessage(embed);
				return;
			}
			case WISHES.love: {
				embed
					.setDescription("Hey mommy :heart:! I'm glad you're here. " +
                    "I finally got the chance to meet you, Thanks dad haha. " +
                    "I'm so excited to share a lot of things with you!" +
                    " Dad always talked about you and how you are his whole universe " +
                    "and i just couldn't wait to be with you mom :heart: " +
                    "I have so much to tell you and bond with you, making your wishes come true. " +
                    "I love you mom :heart: -from your daughter izzi. Oh yeah here's a note from dad and i quote " +
                    "``I love you Mia :heart:``. Yeah... i know he gets cheesy sometimes. Bye mom, see you soon!");

				context.channel?.sendMessage(embed);
				return;
			}
			case WISHES.song: {
				embed.setDescription("Hi mom, I'm glad you're here, " +
                "I was just vibing to your favorite songs join me love. " +
                `\n${links.join("\n")}`);

				context.channel?.sendMessage(embed);
				return;
			}
		}
		return;
	} catch (err) {
		loggers.error("commands.rpg.specialCommands.specialWish(): something went wrong", err);
		return;
	}
};