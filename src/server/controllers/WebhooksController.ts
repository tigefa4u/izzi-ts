import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "../../cache/index";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import loggers from "loggers";
import { DMUserViaApi } from "server/pipes/directMessage";
import { DUNGEON_MAX_MANA } from "helpers/constants";

export const processUpVote = async (req: any, res: any) => {
	try {
		const user_tag: string = req.body.user;
		const summoner = await getRPGUser({ user_tag: user_tag });
		const key = `voted::${user_tag}`;
		const hasVoted = await Cache.get(key);
		if (summoner?.is_banned) return;
		let desc = "";
		if (summoner && !hasVoted) {
			let streak = summoner.vote_streak ? summoner.vote_streak + 1 : 1;
			if (streak > 30) streak = 30;
			let goldReward = 2000 + 150 * streak;
			if (summoner.is_married) {
				goldReward = goldReward + 1000;
			}
			const passReward = summoner.is_married ? 2 : 1;
			if (summoner.raid_pass < summoner.max_raid_pass) {
				summoner.raid_pass = summoner.raid_pass + passReward;
			}
			const shardReward = summoner.is_premium ? 10 : 5;
			summoner.gold = summoner.gold + goldReward;
			if (summoner.mana < summoner.max_mana) summoner.mana = summoner.max_mana;
			if (summoner.dungeon_mana < DUNGEON_MAX_MANA) summoner.dungeon_mana = DUNGEON_MAX_MANA;
			summoner.vote_streak = streak;
			summoner.shards = summoner.shards + shardReward;
			summoner.voted_at = new Date();

			let messageStr =
        "Thank you for voting! You have received " +
        `__${goldReward}__ Gold ${emoji.gold}, __${passReward}__ Raid Permit(s) ${emoji.permitsic}, ` +
        `__${shardReward}__ ` +
        `Shards ${emoji.shard} and refilled your mana and dungeon mana for dailying.`;
			const updateObj = {
				shards: summoner.shards,
				voted_at: summoner.voted_at,
				vote_streak: summoner.vote_streak,
				mana: summoner.mana,
				gold: summoner.gold,
				raid_pass: summoner.raid_pass,
				dungeon_mana: summoner.dungeon_mana
			};

			if (summoner.is_premium) {
				const IPreward = randomNumber(5, 7);
				summoner.izzi_points = summoner.izzi_points
					? summoner.izzi_points + IPreward
					: IPreward;

				Object.assign(updateObj, { izzi_points: summoner.izzi_points });
				messageStr = `${messageStr} You have also received ${emoji.izzipoints} __${IPreward}__ IP.`;
			}
			await updateRPGUser({ user_tag }, updateObj);
			desc = messageStr;
		} else {
			desc =
        "Thank you for voting! To receive more rewards " +
        "start your journey in the Xenverse using ``start``";
		}
		DMUserViaApi(user_tag, { content: desc });
		await Cache.set(key, "1");
		Cache.expire && await Cache.expire(key, 60 * 60);
		return res.sendStatus(200);
	} catch (err: any) {
		loggers.error(
			"server.controllers.WebhookController.processUpvote(): something went wrong",
			err
		);
		return res.status(500).send({
			error: true,
			message: err.message,
		});
	}
};
