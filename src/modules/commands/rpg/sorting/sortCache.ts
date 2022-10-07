import { SortProps } from "@customTypes/sorting";
import Cache from "cache";

export const setSortCache = async (userTag: string, data: SortProps) => {
	const key = "sort::" + userTag;
	const expiresIn = 60 * 60 * 24 * 30;
	Cache.expire && await Cache.expire(key, expiresIn);
	await Cache.set(key, JSON.stringify(data));
	return;
};

export const delSortCache = async (userTag: string) => {
	const key = "sort::" + userTag;
	return await Cache.del(key);
};

export const getSortCache = async (userTag: string): Promise<SortProps | undefined> => {
	const key = "sort::" + userTag;
	const result = await Cache.get(key);
	if (result) return JSON.parse(result);
	else result;
};