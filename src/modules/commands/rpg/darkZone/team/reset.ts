import { DzFuncProps } from "@customTypes/darkZone";
import { TeamMeta } from "@customTypes/teams";
import { updateDzTeam } from "api/controllers/DarkZoneTeamsController";
import loggers from "loggers";

export const resetDzTeam = async ({ context, options }: DzFuncProps) => {
	try {
		const { author } = options;
		const team: TeamMeta[] = [ 1, 2, 3 ].map((n) => ({
			collection_id: null,
			position: n,
			item_id: null,
			itemName: null,
			itemPosition: n
		}));
		await updateDzTeam(author.id, { team: JSON.stringify(team) as any });
		context.channel?.sendMessage("Your Dark Zone team has been successfully reset.");
		return;
	} catch (err) {
		loggers.error("resetDzTeam: ERROR", err);
		return;
	}
};