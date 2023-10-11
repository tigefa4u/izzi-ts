import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber, getCollectionById } from "api/controllers/CollectionInfoController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { CONSOLE_BUTTONS, DEFAULT_STARTER_GUIDE_TITLE } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { startBattle } from "../adventure";
import { getSortCache } from "../sorting/sortCache";

export const selectCard = async ({
	context,
	options,
	args,
	client
}: BaseProps) => {
	try {
		const isFromButtonSource = options.extras?.isFromButtonSource || false;
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
		let infoDataByRow;
		if (isFromButtonSource) {
			infoDataByRow = await getCollectionById({
				id: id,
				user_id: user.id
			});
		} else {
			infoDataByRow = await getCardInfoByRowNumber({
				row_number: id,
				user_id: user.id,
			}, sort);
		}
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
			const button = customButtonInteraction(
				context.channel,
				[ {
					label: CONSOLE_BUTTONS.FLOOR_BT.label,
					params: { id: CONSOLE_BUTTONS.FLOOR_BT.id }
				} ],
				author.id,
				({ id }) => {
					if (id === CONSOLE_BUTTONS.FLOOR_BT.id) {
						startBattle({
							client,
							context,
							args,
							options
						});
					}
					return;
				},
				() => {
					return;
				}
			);
			const embed = createEmbed(author, client).setTitle(`${DEFAULT_STARTER_GUIDE_TITLE} ${emoji.welldone}`)
				.setDescription(`Yay! Well done Summoner **${author.username}**!\n\n` +
				"Now that you have selected your card it is now time to attack a floor boss.\n" +
				"Use ``iz bt`` to initiate a floor battle or click on the button below.")
				.setHideConsoleButtons(true)
				.setFooter({
					iconURL: author.displayAvatarURL(),
					text: "Guide will automatically expire in 10 mins."
				});

			if (button) {
				embed.setButtons(button);
			}
			
			context.channel?.sendMessage(embed);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collections.select.selectCard: ERROR",
			err
		);
		return;
	}
};
