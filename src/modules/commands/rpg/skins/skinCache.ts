import { SkinProps } from "@customTypes/skins";
import Cache from "cache";
import loggers from "loggers";

export const setSkinArr = <T>(tag: string, data: T[]) => {
	try {
		const key = `skins::${tag}`;
		Cache.set(key, JSON.stringify(data));
	} catch (err) {
		return;
	}
};

export const getSkinArr = async (tag: string): Promise<SkinProps[] | undefined> => {
	try {
		const key = `skins::${tag}`;
		const result = await Cache.get(key);
		if (result) return JSON.parse(result);
		return;
	} catch (err) {
		loggers.info("Cache miss for user skin author id: " + tag);
		return;
	}
};

export const delSkinArr = (tag: string) => {
	return Cache.del(`skins::${tag}`);
};