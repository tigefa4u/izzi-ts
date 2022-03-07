import { getAllRaids, updateRaid } from "api/controllers/RaidsController";
import loggers from "loggers";
import { DMUserViaApi } from "./directMessage";

export default async function () {
	try {
		const raids = await getAllRaids();
		if (!raids) return;
		const hour = 1000 * 60 * 60;
		await Promise.all(
			raids.map(async (r) => {
				if (!r.is_start) {
					return;
				}
				const lobby = r.lobby;
				const keys = Object.keys(lobby).map(Number);
				keys.map((k) => {
					if (
						new Date().valueOf() - new Date(lobby[k].timestamp).valueOf() >=
                        hour
					) {
						const desc = `Summoner **${lobby[k].username}**, You have been auto kicked ` +
                        "from the Challening lobby for AFK-ing for more than 1 hour";
						DMUserViaApi(lobby[k].user_tag, { content: desc });
						delete lobby[k];
					}
				});
				return await updateRaid({ id: r.id }, { lobby });
			})
		);
	} catch (err) {
		loggers.error("pipes.autoKick(): something went wrong", err);
		return;
	}
}
