import { BaseProps } from "@customTypes/command";
import { getRPGUser, updateUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { GUIDE_DOCS, IZZI_WEBSITE } from "environment";
import { CONSOLE_BUTTONS, DEFAULT_STARTER_GUIDE_TITLE } from "helpers/constants";
import loggers from "loggers";
import { customButtonInteraction } from "utility/ButtonInteractions";

export const starterGuide = async ({
	context,
	options,
	client,
	args
}: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_STARTER_GUIDE_TITLE).setFooter({
			iconURL: author.displayAvatarURL(),
			text: "Guide will automatically expire 10 mins."
		});

		const key = "guide::" + author.id;
		const endGuide = args.shift();
		const guideInProgress = await Cache.get(key);
		if (endGuide === "complete") {
			await Cache.del(key);
			if (guideInProgress) {
				const userData = JSON.parse(guideInProgress) as any;
				if (userData.moveToOrigin) {
					await updateUser({ user_tag: author.id }, {
						floor: userData.floor,
						ruin: userData.ruin
					});
				}
			}
			embed.setTitle(DEFAULT_STARTER_GUIDE_TITLE + " Completed")
				.setDescription("You have successfully completed the starter guide! " +
            "Use ``@izzi help`` for more info. We wish you the best of luck in your journey, GLHF!");
			context.channel?.sendMessage(embed);
			return;
		}
		if (guideInProgress) {
			embed.setDescription(`Summoner **${author.username}**, a guide is already in progress. ` +
            "Use ``guide complete`` to complete the guide.");
			context.channel?.sendMessage(embed);
			return;
		}
		const buttons = customButtonInteraction(
			context.channel,
			[
				{
					label: CONSOLE_BUTTONS.GUIDE.label,
					params: { id: CONSOLE_BUTTONS.GUIDE.id },
					url: GUIDE_DOCS,
					style: "LINK"
				}
			],
			author.id,
			() => {
				return;
			},
			() => {
				return;
			},
			true,
			11
		);
		if (buttons) {
			embed.setButtons(buttons);
		}
		embed
			.setDescription(`Welcome Summoner **${author.username}**!\n\nThis is a starter guide to ` +
            "help new players familiarize with the gameplay.\nYou have been moved to challenging " +
            "floor ``Zone 1 Floor 1`` in the Xenverse " +
            "(We will move you back to your original location if you were on a " +
            "different location on completion of the guide)\n" +
            "To begin, select a " +
            "card to fight alongside you using ``@izzi select 1``");
        
		const cacheParams = {
			moveToOrigin: false,
			floor: 1,
			ruin: 1 
		};
		if (user.floor > 1 || user.ruin > 1) {
			cacheParams.moveToOrigin = true;
			cacheParams.floor = user.floor;
			cacheParams.ruin = user.ruin;
			await updateUser({ user_tag: author.id }, { 
				floor: 1,
				ruin: 1
			});
		}
		await Cache.set(key, JSON.stringify(cacheParams));
		Cache.expire && Cache.expire(key, 60 * 10);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("commands.rpg.profile.guide.starterGuide: ERROR", err);
		return;
	}
};