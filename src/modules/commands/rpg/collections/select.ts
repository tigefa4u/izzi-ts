import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { DEFAULT_STARTER_GUIDE_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { getSortCache } from "../sorting/sortCache";

export const selectCard = async ({
	context,
	options,
	args,
	client
}: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || id <= 0 || isNaN(id)) return;
		const key = "guide::" + author.id;
		const [ user, starterGuide ] = await Promise.all([
			getRPGUser({ user_tag: author.id }, { cached: true }),
			Cache.get(key)
		]);
		if (!user) return;
		const sort = await getSortCache(author.id);
		const infoDataByRow = await getCardInfoByRowNumber({
			row_number: id,
			user_id: user.id,
		}, sort);
		if (!infoDataByRow) return;
		const infoData = infoDataByRow[0];
		await updateRPGUser(
			{ user_tag: user.user_tag },
			{ selected_card_id: infoData.id }
		);
		context.channel?.sendMessage(
			`You have now selected __${titleCase(infoData.rank)}__ **Level ${
				infoData.character_level
			} ${titleCase(infoData.metadata?.nickname || infoData.name)}** to fight alongside you on your journey.`
		);
		
		if (starterGuide) {
			const embed = createEmbed(author, client).setTitle(`${DEFAULT_STARTER_GUIDE_TITLE} ${emoji.welldone}`)
				.setDescription(`Yay! Well done Summoner **${author.username}**! You have selected ` +
				"your first card from your card collection. To view all of your collections use ``@izzi inv``\n" +
				"Now that you have selected your card it is now time to attack a floor boss. " +
				"Use ``@izzi bt`` to initiate a floor battle.")
				.setFooter({
					iconURL: author.displayAvatarURL(),
					text: "Guide will automatically expire in 10 mins."
				});
			
			context.channel?.sendMessage(embed);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collections.select.selectCard(): something went wrong",
			err
		);
		return;
	}
};
