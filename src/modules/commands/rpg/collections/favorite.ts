import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { updateCollection } from "api/controllers/CollectionsController";
import { getRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { titleCase } from "title-case";

export const favorite = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const collectionDataByRow = await getCardInfoByRowNumber({
			row_number: id,
			user_id: user.id,
		});
		if (!collectionDataByRow) {
			context.channel?.sendMessage(
				"We could not find the card you were looking for in your inventory! :x:"
			);
			return;
		}
		const collectionData = collectionDataByRow[0];
		collectionData.is_favorite = true;
		await updateCollection(
			{ id: collectionData.id },
			{ is_favorite: collectionData.is_favorite }
		);
		context.channel?.sendMessage(
			`Successfully added **${titleCase(
				collectionData.name
			)}** to your favorites ${emoji.favorite}`
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.collections.favorite.favorite(): something went wrong",
			err
		);
		return;
	}
};
