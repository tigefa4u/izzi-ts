import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { titleCase } from "title-case";
import { getSortCache } from "../sorting/sortCache";

export const selectCard = async ({
	context,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || id <= 0 || isNaN(id)) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
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
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collections.select.selectCard(): something went wrong",
			err
		);
		return;
	}
};
