import { BaseProps } from "@customTypes/command";
import { getDarkZoneProfile, updateDzProfile } from "api/controllers/DarkZoneController";
import { createEmbed } from "commons/embeds";
import { numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const handleDarkZoneFloor = async ({ context, client, options, args }: BaseProps) => {
	try {
		const { author } = options;
		const dzUser = await getDarkZoneProfile({ user_tag: author.id });
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		if (!dzUser) {
			embed.setDescription("You have not started your journey in the Dark Zone. Type `iz dz start`");
			context.channel?.sendMessage(embed);
			return;
		}
		const paramArg = args.shift();
		let moveToFloor: number;
		if (paramArg === "n") {
			moveToFloor = dzUser.floor + 1;
		} else {
			moveToFloor = parseInt(paramArg || "0");
		}
		if (moveToFloor <= 0 || isNaN(moveToFloor)) {
			embed.setDescription("Please provide a valid floor number");
			context.channel?.sendMessage(embed);
			return;
		}
		if (moveToFloor > dzUser.max_floor) {
			embed.setDescription(`Summoner **${author.username}**, You have not unlocked this floor yet!`);
			context.channel?.sendMessage(embed);
			return;
		}
		await updateDzProfile({ user_tag: author.id }, { floor: moveToFloor });
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Summoner **${author.username}**, You have successfully moved to ` +
        `floor __${numericWithComma(moveToFloor)}__. Type \`\`iz dz bt\`\` to battle the floor boss.`);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("handleDarkZoneFloor: ERROR", err);
		return;
	}
};