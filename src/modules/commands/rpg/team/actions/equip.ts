import { AuthorProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams } from "@customTypes/selectMenu";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getCollection } from "api/controllers/CollectionsController";
import { getItemById } from "api/controllers/ItemsController";
import { getAllTeams, getTeamById, updateTeam } from "api/controllers/TeamsController";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import { titleCase } from "title-case";
import { clone } from "utility";
import { prepareAndSendTeamMenuEmbed, showTeam } from "..";
import { preparePositionOptions } from "./set";

async function handlePositionSet(
	params: SelectMenuCallbackParams<{
        teamId: number;
        user_id: number;
        itemId: number;
    }>,
	value?: string
) {
	const teamId = params.extras?.teamId;
	const userId = params.extras?.user_id;
	const itemId = params.extras?.itemId;
	if (!teamId || !userId || !value || !itemId) return;
	const item = await getItemById({ id: itemId });
	if (!item) {
		throw new Error("Unable to Find Item with ID: " + itemId);
	}
	const team = await getTeamById({
		id: teamId,
		user_id: userId 
	});
	if (!team) {
		params.channel?.sendMessage("Unable to fetch team, please try again");
		return;
	}
	const position = +value;
	if (position > 3 || position < 1) {
		params.channel?.sendMessage(
			"Unable to assign to this position, Please reset your team using ``team reset <name>``"
		);
		return;
	}

	const cids: number[] = [];
	team.metadata.map((m) => {
		if (m.collection_id) {
			cids.push(m.collection_id);
		}
	});
	const collections = await getCollectionById({
		ids: cids,
		user_id: userId
	});
	if (!collections) return;
	const collectionsMeta = collections.reduce((acc, r) => {
		acc[r.item_id] = r;
		return acc;
	}, {} as { [key: number]: CollectionCardInfoProps });
	if (collectionsMeta[itemId]) {
		params.channel?.sendMessage(
			`**${titleCase(item.name)}** ${emojiMap(item.name)} is already equipped by one of the cards in this team.`
		);
		return;
	}
	const index = team.metadata.findIndex((t) => t.item_id === itemId);
	if (index >= 0) {
		team.metadata[index].item_id = null;
		team.metadata[index].itemName = null;
	}
	team.metadata[position - 1] = {
		...team.metadata[position - 1],
		itemPosition: position,
		item_id: itemId,
		itemName: item.name
	};
	await updateTeam(
		{
			id: team.id,
			user_id: userId
		},
		{ metadata: JSON.stringify(team.metadata) }
	);

	params.channel?.sendMessage(
		`Successfully assigned __${titleCase(item.name)}__ ${emojiMap(item.name)} to __Position #${position}__`
	);
	return;
}

export const equipTeamItem = async ({
	client,
	context,
	author,
	user_id,
	args,
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	const itemId = Number(args.shift());
	if (!itemId || isNaN(itemId)) return;
	const name = args.join(" ");
	if (!name) {
		context.channel?.sendMessage("Please enter a valid Team Name");
		return;
	}
	const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
	const teams = await getAllTeams({
		name,
		user_id 
	});
	if (!teams || teams.length <= 0) {
		embed.setDescription("We cound not find the team you were looking for");
		context.channel?.sendMessage(embed);
		return;
	}
	const team = teams[0];
	if (team.metadata.every((t) => !t.collection_id)) {
		context.channel?.sendMessage("Please assign a valid card to the Team before equipping an item.");
		return;
	}
	const itemInCollection = await getCollection({
		item_id: itemId,
		user_id,
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
	const teamDetails = await showTeam({
		user_id,
		name: team.name 
	});
	if (teamDetails) {
		embed.setTitle(teamDetails.title)
			.setDescription(teamDetails.desc);

		context.channel?.sendMessage(embed);
	}
	const positionOptions = preparePositionOptions();
	const params = {
		channel: context.channel,
		author,
		client,
		extras: {
			teamId: team.id,
			user_id,
			itemId,
		},
	};
    
	prepareAndSendTeamMenuEmbed(
		params.channel,
		params.author,
		params.client,
		positionOptions,
		params,
		handlePositionSet,
		{
			title: `Team ${team.name}`,
			description: "Select a Position to Assign" 
		}
	);
	return;
};