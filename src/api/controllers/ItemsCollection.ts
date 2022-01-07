import { FilterProps, ResponseWithPagination } from "@customTypes";
import { ItemProps } from "@customTypes/items";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Items from "../models/Items";
import { get as getCollections } from "../models/Collections";

type T = { user_id?: number };

export const getItems: (
  filter: Pick<FilterProps, "name" | "ids"> & T,
  pageProps: PageProps,
  options?: {
    withCollection?: boolean;
  }
) => Promise<ResponseWithPagination<ItemProps[]> | undefined> = async (
	filter,
	pageProps,
	options = { withCollection: false }
) => {
	try {
		if (options.withCollection) {
			if (!filter.user_id) return;
			const itemCollection = await getCollections(
				{
					is_on_market: false,
					is_item: true,
					user_id: filter.user_id,
				},
				await paginationParams(pageProps)
			);
			const ids = itemCollection.map((c) => c.item_id && c.item_id);
			if (ids.length <= 0) {
				return;
			}
			Object.assign(filter, { ids });
		}
		const result = await Items.get(
			await paginationParams(pageProps),
			filter
		);
		const pagination = await paginationForResult({
			data: result,
			query: pageProps,
		});
		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"api.controllers.ItemsController.getItems(): something went wrong",
			err
		);
		return;
	}
};
