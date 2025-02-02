import { BaseProps } from "@customTypes/command";
import { getUserRaidLobby, updateRaidEnergy } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { randomElementFromArray } from "helpers";
import loggers from "loggers";
import { clearCooldown, getCooldown } from "modules/cooldowns";

const WISHES = {
	spawnReset: "raid-spawn-reset",
	raidEnergy: "raid-energy",
	// siblings: "siblings",
	// love: "love",
	// song: "song",
	// momSings: "mom-sings"
};

export const specialWish = async ({ client, context, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const wishes = Object.values(WISHES);
		let wish = args.shift();
		if (!wish) {
			wish = randomElementFromArray(wishes);
		}
		const embed = createEmbed(author, client).setTitle("Izzi Wish");

		switch (wish) {
			case WISHES.spawnReset: {
				const cd = await getCooldown(author.id, "raid-spawn");
				if (cd) {
					await clearCooldown(author.id, "raid-spawn");
					embed.setDescription("Try spawning a raid.");
				} else {
					embed.setDescription(`Pray to wishing well, ${emoji.sleepy}.`);
				}

				context.channel?.sendMessage(embed);
				return;
			}
			// case WISHES.love: {
			// 	embed
			// 		.setDescription("Hey mommy :heart:! I'm glad you're here. " +
			//         "I finally got the chance to meet you, Thanks dad haha. " +
			//         "I'm so excited to share a lot of things with you!" +
			//         " Dad always talked about you and how you are his whole universe " +
			//         "and i just couldn't wait to be with you mom :heart: " +
			//         "I have so much to tell you and bond with you, making your wishes come true. " +
			//         "I love you mom :heart: -from your daughter izzi. Oh yeah here's a note from dad and i quote " +
			//         "``I love you Mia``. Yeah... i know he gets cheesy sometimes. Bye mom, see you soon!");

			// 	context.channel?.sendMessage(embed);
			// 	return;
			// }
			// case WISHES.song: {
			// 	embed.setDescription("Hi mom, I'm glad you're here, " +
			//     "I was just vibing to your favorite songs join me love. " +
			//     `\n${links.join("\n\n")}`);

			// 	context.channel?.sendMessage(embed);
			// 	return;
			// }
			// case WISHES.momSings: {
			// 	embed.setDescription("Hey mom! :heart: Happy to see you again. Wow I'm kinda impressed! " +
			// 	"Dad tod me all about your singing, now i know why I'm good at singing too hehe. " +
			// 	"Its super amazing! I love it! And you probably need to use headphones to hear dad sing, " +
			// 	"its so bad! XD " +
			// 	`\n${soundCloudLinks.join("\n\n")}`);

			// 	context.channel?.sendMessage(embed);
			// 	return;
			// }
			case WISHES.raidEnergy: {
				const user = await getRPGUser({ user_tag: author.id }, { cached: true });
				if (!user) return;
				const currentRaid = await getUserRaidLobby({ user_id: user.id });
				if (!currentRaid) {
					embed.setDescription("Join a raid first will you. Noob.");

					context.channel?.sendMessage(embed);
					return;
				}
				if (currentRaid.lobby[user.id].energy < 25) {
					await updateRaidEnergy({ id: currentRaid.id }, {
						[user.id]: {
							...currentRaid.lobby[user.id],
							energy: 25
						}
					});
					embed.setDescription("There you go loser, " +
					"I've refilled your energy, so attack away!");
				} else {
					embed.setDescription(`GG noob ${emoji.sleepy}.`);
				}

				context.channel?.sendMessage(embed);
				return;
			}
			// case WISHES.siblings: {
			// 	embed.setDescription("Hey mom, I felt lonely when you and dad were away in Egypt. " +
			// 	"So, can I please get a Sister and a Brother <3.");

			// 	context.channel?.sendMessage(embed);
			// 	return;
			// }
		}
		return;
	} catch (err) {
		loggers.error("commands.rpg.specialCommands.specialWish: ERROR", err);
		return;
	}
};