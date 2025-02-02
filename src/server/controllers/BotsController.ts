import Cache from "cache";
import { clear as resetImageCache } from "cache/imageCache";
import flushBattleCooldowns from "server/autoClear";
import { notFound, success } from "server/responses";

export const toggleRaids = async (req: any, res: any) => {
	try {
		const raidDisabled = await Cache.get("disable-raids");
		const { isDelete } = req.body;
		if (raidDisabled && !isDelete) {
			return res.send({
				data: {
					success: true,
					code: 302,
					message: "Raids are disabled",
				}
			});
		}
		if (!raidDisabled) {
			await Cache.set(
				"disable-raids",
				JSON.stringify({ disabled: true })
			);
		}
		if (isDelete) {
			await Cache.del("disable-raids");
		}
		await flushBattleCooldowns();
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};

export const setMaxLocation = async (req: any, res: any) => {
	try {
		const { maxLocation } = req.body;
		if (maxLocation) {
			await Cache.set("max::location", maxLocation);
		}
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};

export const removeZoneAndCardFromCache = async (req: any, res: any) => {
	try {
		const { location_id, character_ids = [] } = req.body;
		const key = `zone::${location_id}`;
		await Cache.del(key);
		await Promise.all(character_ids.map((c: number) => Cache.del(`floors::ch-${c}`)));
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};

export const removeItemFromCache = async (req: any, res: any) => {
	try {
		const { item_id } = req.body;
		const key = `item::${item_id}`;
		await Cache.del(key);
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};

export const removeAllStagesAndCardsFromCache = async (req: any, res: any) => {
	try {
		const { character_ids = [] } = req.body;
		const key = "stage::*";
		await Cache.del(key);
		console.log("removed: ", character_ids);
		await Promise.all(character_ids.map((c: number) => Cache.del(`card::ch-${c}*`)));
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};

export const removeCommandsFromCache = async (req: any, res: any) => {
	try {
		const { id } = req.body;
		const key = `command::${id}`;
		await Cache.del(key);
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};

export const clearImageCache = (req: any, res: any) => {
	try {
		resetImageCache();
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};