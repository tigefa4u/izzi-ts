import Cache from "cache";
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

export const removeZoneFromCache = async (req: any, res: any) => {
	try {
		const { location_id, character_ids = [] } = req.body;
		const key = `zone::${location_id}`;
		await Cache.del(key);
		await Promise.all(character_ids.map(async (c: number) => await Cache.del(`floors::ch-${c}`)));
		return success(res, {});
	} catch (err) {
		return notFound(res, "Route not found");
	}
};