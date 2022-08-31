import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import {
	getCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import { getItemById } from "api/controllers/ItemsController";
import { getAllTeams, updateTeam } from "api/controllers/TeamsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { getSortCache } from "../sorting/sortCache";

async function findItemInTeamAndRemove({
	userId,
	itemId,
	collectionId,
}: {
  userId: number;
  itemId: number;
  collectionId: number;
}) {
	try {
		const teams = await getAllTeams({ user_id: userId });
		if (teams && teams.length > 0) {
			const team = teams.find((tm) => tm.metadata.find((m) => m.collection_id === collectionId));
			if (team) {
				const idx = team.metadata.findIndex((m) => m.item_id === itemId);
				if (idx >= 0) {
					team.metadata[idx].item_id = null;
					team.metadata[idx].itemName = null;
					return await updateTeam({
						id: team.id,
						user_id: userId 
					}, { metadata: JSON.stringify(team.metadata) });
				}
			}
		}
	} catch (err) {
		loggers.error("useItems.findItemInTeamAndRemove(): ERROR ", err);
		return;
	}
}

export const equip = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const cid = Number(args.shift());
		const itemId = Number(args.shift());
		if (!cid || !itemId || isNaN(cid) || isNaN(itemId)) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const sort = await getSortCache(author.id);
		const collectionDataByRow = await getCardInfoByRowNumber({
			row_number: cid,
			user_id: user.id,
		}, sort);
		if (!collectionDataByRow) return;
		const collectionData = collectionDataByRow[0];
		const itemInCollection = await getCollection({
			is_on_market: false,
			is_item: true,
			item_id: itemId,
			user_id: user.id,
		});
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!itemInCollection || itemInCollection.length <= 0) {
			embed.setDescription(
				"We could not find the item you were looking for your in your Inventory."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const itemAlreadyEquipped = await getCollection({
			is_item: false,
			item_id: itemId,
			user_id: user.id,
		});
		if (itemAlreadyEquipped && itemAlreadyEquipped.length > 0) {
			const collectionIds = itemAlreadyEquipped.map((it) => it.id);
			await updateCollection({ ids: collectionIds }, { item_id: null });
		}
		const item = await getItemById({ id: itemId });
		if (!item) {
			throw new Error("Unable to Find Item with ID: " + itemId);
		}
		await Promise.all([
			updateCollection({ id: collectionData.id }, { item_id: itemId }),
			findItemInTeamAndRemove({
				userId: user.id,
				itemId: item.id,
				collectionId: collectionData.id 
			})
		]);

		const name = collectionData.metadata?.nickname || collectionData.name;
		const attachment = createAttachment(item.filepath, "item.jpg");
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`**Level ${collectionData.character_level}** __${titleCase(
					collectionData.rank
				)}__ **${titleCase(
					name
				)}** has successfully equipped **${titleCase(item.name)}** ${emojiMap(
					item.name
				)}`
			)
			.setThumbnail("attachment://item.jpg")
			.attachFiles([ attachment ]);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.items.useItems.equip(): something went wrong",
			err
		);
		return;
	}
};

export const unEquip = async ({
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
		if (!collectionDataByRow) return;
		const collectionData = collectionDataByRow[0];
		if (!collectionData.item_id) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_SUCCESS_TITLE);
		const item = await getItemById({ id: collectionData.item_id });
		if (!item) return;
		await updateCollection({ id: collectionData.id }, { item_id: null });
		const name = collectionData.metadata?.nickname || collectionData.name;
		const attachment = createAttachment(item.filepath, "item.jpg");
		embed
			.setDescription(
				`**${titleCase(item.name)}** ${emojiMap(
					item.name
				)} has been removed from **${titleCase(name)}**`
			)
			.setThumbnail("attachment://item.jpg")
			.attachFiles([ attachment ]);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.items.useItems.unEquip(): something went wrong",
			err
		);
		return;
	}
};
