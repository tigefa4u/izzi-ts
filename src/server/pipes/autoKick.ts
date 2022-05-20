import { getAllRaids, updateRaid } from "api/controllers/RaidsController";
import { delay } from "helpers";
import loggers from "loggers";
import { DMUserViaApi } from "./directMessage";

export default async function () {
	try {
		const raids = await getAllRaids();
		if (!raids) return;
		const hour = 1000 * 60 * 90;
		await Promise.all(
			raids.map(async (r) => {
				if (!r.is_start) {
					return;
				}
				const lobby = r.lobby;
				let keys = Object.keys(lobby).map(Number);
				if (keys.length <= 1) return;
				for (const k of keys) {
					await delay(1500);
					if (
						new Date().valueOf() - new Date(lobby[k].timestamp).valueOf() >=
                        hour
					) {
						const member = lobby[k];
						delete lobby[k];
						if (member.is_leader) {
							keys = Object.keys(lobby).map(Number);
							if (keys.length > 0) {
								lobby[keys[0]].is_leader = true;
							}
						}
						const desc = `Summoner **${member.username}**, You have been auto kicked ` +
                        "from the Challening lobby for AFK-ing for more than 1 hour";
						DMUserViaApi(member.user_tag, { content: desc });
					}
				}
				return await updateRaid({ id: r.id }, { lobby });
			})
		);
	} catch (err) {
		loggers.error("pipes.autoKick(): something went wrong", err);
		return;
	}
}
