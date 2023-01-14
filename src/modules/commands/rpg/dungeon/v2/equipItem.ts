import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getCollection } from "api/controllers/CollectionsController";
import { getDGTeam, updateDGTeam } from "api/controllers/DungeonsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const equipDGItem = async ({ context, options, client, args }: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const posi = Number(args.shift());
		if (!posi || isNaN(posi) || posi < 0 || posi > 3) {
			context.channel?.sendMessage("Please provide a valid item position to assign.");
			return;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const [ dgTeam, user ] = await Promise.all([
			getDGTeam(author.id),
			getRPGUser({ user_tag: author.id }, { cached: true })
		]);
		if (!user) return;
		if (!dgTeam) {
			embed.setDescription(
				`Summoner **${author.username}**, You do not have a DG Team. ` +
                "You can create one using ``iz dg create <name>``"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const team = dgTeam.team;
		if (team.metadata.every((t) => !t.collection_id)) {
			context.channel?.sendMessage("Please assign a valid card to the DG Team before equipping an item.");
			return;
		}
		const itemInCollection = await getCollection({
			item_id: id,
			user_id: user.id,
			is_item: true,
			is_on_market: false
		});
		if (!itemInCollection || itemInCollection.length <= 0) {
			embed.setDescription(
				"We could not find the item you were looking for your in your Inventory."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		// find item in dg team and replace
		const cids: number[] = [];
		team.metadata.map((m) => {
			if (m.collection_id) {
				cids.push(m.collection_id);
			}
		});
		const collections = await getCollectionById({
			ids: cids,
			user_id: user.id
		});
		if (!collections) return;
		const item = itemInCollection[0];
		const collectionsMeta = collections.reduce((acc, r) => {
			acc[r.item_id] = r;
			return acc;
		}, {} as { [key: number]: CollectionCardInfoProps });
		if (collectionsMeta[item.id]) {
			context.channel?.sendMessage(
				`**${titleCase(item.name || "")}** ${emojiMap(item.name)} is already ` +
                "equipped by one of the cards in this team."
			);
			return;
		}
		const index = team.metadata.findIndex((t) => t.item_id === item.id);
		if (index >= 0) {
			team.metadata[index].item_id = null;
			team.metadata[index].itemName = null;
		}
		team.metadata[posi - 1] = {
			...team.metadata[posi - 1],
			itemPosition: posi,
			item_id: item.id,
			itemName: item.name
		};
		await updateDGTeam(author.id, {
			team: {
				...team,
				metadata: team.metadata
			}
		});
		context.channel?.sendMessage(
			`Successfully assigned __${titleCase(item.name || "")}__ ` +
            `${emojiMap(item.name)} to __Position #${posi}__`
		);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.equipItem.equipDGItem: ERROR", err);
		return;
	}
};