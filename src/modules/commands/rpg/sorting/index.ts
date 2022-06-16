import { BaseProps } from "@customTypes/command";
import { SortProps } from "@customTypes/sorting";
import { createEmbed } from "commons/embeds";
import { DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { delSortCache, setSortCache } from "./sortCache";

const getSortMap = () => {
	return [
		{
			name: "ascending",
			alias: [ "-a", "-asc" ],
			type: "sortOrder",
			action: "asc",
		},
		{
			name: "descending",
			alias: [ "-d", "-desc" ],
			type: "sortOrder",
			action: "desc",
		},
		{
			name: "rank",
			alias: [ "-r", "-rank", "rank" ],
			type: "sortBy",
			action: "rank_id",
		},
		{
			name: "id",
			alias: [ "-i" ],
			type: "sortBy",
			action: "id",
		},
	];
};

export const sort = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const key = `sort::${author.id}`;
		if (args[0] === "reset") {
			delSortCache(key);
			context.channel?.sendMessage("Successfully reset sorting order");
			return;
		}
		const sortMap = getSortMap();
		const params = {
			sortBy: "id",
			sortOrder: "asc",
		} as SortProps;
		for (let i = 0; i <= args.length; i++) {
			const temp = args.shift();
			const index = sortMap.findIndex((sorter) =>
				sorter.alias.includes(temp || "-i")
			);
			if (index >= 0) {
				Object.assign(params, { [sortMap[index].type]: sortMap[index].action });
			}
		}
		await setSortCache(key, params);
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				"Successfully updated collections to be sorted by" +
          " " +
          `__${
          	params.sortBy === "rank_id" ? "RANK" : params.sortBy.toUpperCase()
          }__ in **${params.sortOrder.toUpperCase()}** order!`
			);

		context.channel?.sendMessage(embed);
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.sorting.sort(): something went wrong",
			err
		);
		return;
	}
};
