import { SortProps } from "@customTypes/sorting";
import Cache from "cache";

export const setSortCache = async (key: string, data: SortProps) => {
	const expiresIn = 1000 * 60 * 60 * 24 * 30;
	Cache.expire && await Cache.expire(key, expiresIn);
	await Cache.set(key, JSON.stringify(data));
	return;
};

export const delSortCache = async (key: string) => {
	return await Cache.del(key);
};

export const getSortCache = async (key: string): Promise<SortProps | undefined> => {
	const result = await Cache.get(key);
	if (result) return JSON.parse(result);
	else result;
};