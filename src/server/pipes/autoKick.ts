import { RaidProps } from "@customTypes/raids";
import { getAllRaids, updateRaid } from "api/controllers/RaidsController";
import loggers from "loggers";

export default async function (raids: RaidProps[]) {
	try {
		const hour = 1000 * 60 * 60;
		await Promise.all(
			raids.map(async (r) => {
				if (!r.is_start) {
					return;
				}
				const lobby = r.lobby;
				let keys = Object.keys(lobby).map(Number);
				if (keys.length <= 1) return;
				let canUpdateRaid = false;
				keys.map((k) => {
					if (
						new Date().valueOf() - new Date(lobby[k].timestamp).valueOf() >=
                        hour
					) {
						if (!canUpdateRaid) {
							canUpdateRaid = true;
						}
						const member = lobby[k];
						delete lobby[k];
						loggers.info("pipes.autoKick: auto kicking member", {
							raidId: r.id,
							member
						});
						if (member.is_leader) {
							keys = Object.keys(lobby).map(Number);
							if (keys.length > 0) {
								lobby[keys[0]].is_leader = true;
							}
						}
						// const desc = `Summoner **${member.username}**, You have been auto kicked ` +
						// "from the Challening lobby for AFK-ing for more than 1 hour";
						// DMUserViaApi(member.user_tag, { content: desc });
					}
				});
				// for (const k of keys) {
				// 	// await delay(1500);
				// 	if (
				// 		new Date().valueOf() - new Date(lobby[k].timestamp).valueOf() >=
				//         hour
				// 	) {
				// 		if (!canUpdateRaid) {
				// 			canUpdateRaid = true;
				// 		}
				// 		const member = lobby[k];
				// 		delete lobby[k];
				// 		loggers.info("pipes.autoKick: auto kicking member: " + JSON.stringify(member) +
				// 		" from raid: " + r.id);
				// 		if (member.is_leader) {
				// 			keys = Object.keys(lobby).map(Number);
				// 			if (keys.length > 0) {
				// 				lobby[keys[0]].is_leader = true;
				// 			}
				// 		}
				// 		// const desc = `Summoner **${member.username}**, You have been auto kicked ` +
				// 		// "from the Challening lobby for AFK-ing for more than 1 hour";
				// 		// DMUserViaApi(member.user_tag, { content: desc });
				// 	}
				// }
				if (canUpdateRaid) {
					loggers.info("pipes.autoKick: updating raid lobby -> ", {
						raidId: r.id,
						lobby
					});
					await updateRaid({ id: r.id }, { lobby });
				}
				return;
			})
		);
	} catch (err) {
		loggers.error("pipes.autoKick: ERROR", err);
		return;
	}
}
