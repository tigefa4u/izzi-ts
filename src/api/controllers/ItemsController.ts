import { FilterProps, ResponseWithPagination } from "@customTypes";
import { ItemProps } from "@customTypes/items";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Items from "../models/Items";
import { getAll as getCollections } from "../models/Collections";
import Cache from "cache";
import { clone } from "utility";

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
		let collectionTotalCount = 0;
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
			collectionTotalCount = itemCollection[0].total_count || 0;
			Object.assign(filter, { ids });
		}
		let itemPageProps = clone(pageProps);
		if (options.withCollection) {
			itemPageProps = {
				currentPage: 1,
				perPage: 20
			};
		}
		const result = await Items.getAll(
			await paginationParams(itemPageProps),
			filter
		);
		if (options.withCollection && collectionTotalCount) {
			result.map((item) => {
				Object.assign(item, { total_count: collectionTotalCount });
			});
		}
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

export const getItemById = async (params: { id: number }) => {
	try {
		const key = `item::${params.id}`;
		const result = await Cache.fetch(key, async () => {
			const resp = await Items.get(params);
			return resp[0];
		});

		return result;
	} catch (err) {
		loggers.error("api.controllers.ItemsController.getItemById(): something went wrong", err);
		return;
	}
};