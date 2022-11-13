import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { updateCollection } from "api/controllers/CollectionsController";
import { getRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { titleCase } from "title-case";
import { getSortCache } from "../sorting/sortCache";

export const favorite = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const sort = await getSortCache(author.id);
		const collectionDataByRow = await getCardInfoByRowNumber({
			row_number: id,
			user_id: user.id,
		}, sort);
		if (!collectionDataByRow) {
			context.channel?.sendMessage(
				"We could not find the card you were looking for in your inventory! :x:"
			);
			return;
		}
		const collectionData = collectionDataByRow[0];
		collectionData.is_favorite = !collectionData.is_favorite;
		await updateCollection(
			{ id: collectionData.id },
			{ is_favorite: collectionData.is_favorite }
		);
		if (collectionData.is_favorite) {
			context.channel?.sendMessage(
				`Successfully added **${titleCase(
					collectionData.name
				)}** to your favorites ${emoji.favorite}`
			);
		} else {
			context.channel?.sendMessage(
				`Successfully removed **${titleCase(
					collectionData.name
				)}** from your favorites ${emoji.favorite} collection`
			);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collections.favorite.favorite: ERROR",
			err
		);
		return;
	}
};
