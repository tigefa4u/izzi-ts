import { FilterProps } from "@customTypes";
import { StatRelationProps } from "@customTypes/abilities";
import { CharacterStatProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { ItemProps } from "@customTypes/items";
import { getItems } from "api/controllers/ItemsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { statRelationMap } from "helpers/ability";
import { PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createItemList } from "helpers/embedLists/items";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";

type O = { withCollection: boolean };

function prepareItemStats(stats: CharacterStatProps) {
	const responseObj = {} as StatRelationProps;
	Object.keys(stats).forEach((key) => {
		if (stats[key as keyof CharacterStatProps] > 0) {
			Object.assign(responseObj, {
				[statRelationMap[key as keyof CharacterStatProps] || key.toUpperCase()]:
          stats[key as keyof CharacterStatProps],
			});
		}
	});
	return responseObj;
}

export const itemCollection = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const params = fetchParamsFromArgs<FilterProps>(args);
		Object.assign(params, { user_id: user.id });
		let embed = createEmbed();
		let sentMessage: Message;
		const filter = clone(PAGE_FILTER);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0]);
			delete params.page;
		}
		const buttons = await paginatorInteraction<
      Pick<FilterProps, "name" | "ids">,
      ItemProps[],
      O
    >(
    	context.channel,
    	author.id,
    	params,
    	filter,
    	getItems,
    	(data, options) => {
    		if (data) {
    			const list = createItemList(
    				data.data,
    				data.metadata.currentPage,
    				data.metadata.perPage
    			);
    			embed = createEmbedList({
    				author,
    				list,
    				currentPage: data.metadata.currentPage,
    				totalPages: data.metadata.totalPages,
    				totalCount: data.metadata.totalCount,
    				client,
    				pageCount: data.data.length,
    				pageName: "Items",
    				description:
              "All Items in your inventory that match your" +
              "requirements are shown below.",
    				title: "Item Collection",
    			});
    		} else {
    			embed.setDescription("You currently have no items. You can purchase items using ``itemshop``");
    		}
    		if (options?.isDelete && sentMessage) {
    			sentMessage.delete();
    		}
    		if (options?.isEdit) {
    			sentMessage.editMessage(embed);
    		}
    	},
    	{ withCollection: true }
    );
		if (!buttons) return;

		embed.setButtons(buttons);

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.items.itemCollection(): something went wrong",
			err
		);
		return;
	}
};

export const itemInfo = async ({
	context,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const pageFilter = clone(PAGE_FILTER);
		const itemRes = await getItems({ name: args.join(" ") }, pageFilter);
		if (!itemRes) return;
		const item = itemRes.data[0];
		if (!item) return;
		const preparedStats = prepareItemStats(item.stats);
		const attachment = createAttachment(item.filepath, "item.jpg");
		const embed = createEmbed();
		embed
			.setAuthor(author.username, author.displayAvatarURL())
			.setTitle(titleCase(item.name))
			.setDescription(
				"Items give your cards additional stats buffing their abilities\n" +
          "You can equip an item using ``equip 1 14``\n\n" +
          `${Object.keys(preparedStats).map(
          	(key) =>
          		`**${key}:** ${preparedStats[key as keyof StatRelationProps]}`
          ).join("\n")}` +
          `\n\n**Ability Grant**\n${item.description}`
			)
			.attachFiles([ attachment ])
			.setThumbnail("attachment://item.jpg");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.items.itemInfo(): something went wrong",
			err
		);
		return;
	}
};
