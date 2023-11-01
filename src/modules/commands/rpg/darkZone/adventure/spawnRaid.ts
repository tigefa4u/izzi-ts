import { DzFuncProps } from "@customTypes/darkZone";
import Cache from "cache";
import loggers from "loggers";
import { spawnRaid } from "../../raids/actions/spawn";

export const spawnDzRaid = async ({ context, client, args, options }: DzFuncProps) => {
	try {
		if (!context.guild?.id) return;
		const disableRaids = await Cache.get("disable-raids");
		if (disableRaids) {
			context.channel?.sendMessage(
				"Command disabled, There could be an on going event. Use ``iz help event`` for more info"
			);
			return;
		}
		await spawnRaid({
			context,
			options,
			client,
			args,
			isEvent: false,
			darkZoneSpawn: true,
		});
		return;
	} catch (err) {
		loggers.error("adventure.spawnDzRaid: ERROR", err);
		return;
	}
};