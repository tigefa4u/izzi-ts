import { BaseProps } from "@customTypes/command";
import { updateCollection } from "api/controllers/CollectionsController";
import { getRaid, updateRaid } from "api/controllers/RaidsController";
import { getWorldBossRaid } from "api/controllers/WorldBossController";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { numericWithComma } from "helpers";
import { DMUser } from "helpers/directMessages";
import { RankProps, RanksMetaProps } from "helpers/helperTypes";
import { ranksMeta } from "helpers/rankConstants";
import loggers from "loggers";
import { start } from "modules/commands/rpg/profile/startJourney";

export const setCharacterRank = async ({ client, context, options, args }: BaseProps) => {
	try {
		const author = options.author;
		if (author.id !== OWNER_DISCORDID) {
			context.channel?.sendMessage("Sorry mom, this command can only be used by Dad! " + emoji.cry);
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const rank = args.shift() as RankProps;
		if (!rank) return;
		const rankFound = ranksMeta[rank];
		if (!rankFound) return;
		await updateCollection({ id }, {
			rank,
			rank_id: rankFound.rank_id 
		});
		const msg = `Hey Dad, I've updated the character rank to __${rank}__ for the card ID: __${id}__`;
		context.channel?.sendMessage(msg);
		DMUser(client, msg + " Modified by: " + author.id, OWNER_DISCORDID);
	} catch (err) {
		loggers.error("specialCommands.setCharacterRank: ERROR", err);
		return;
	}
};

export const setCharacterLevel = async ({ client, context, options, args }: BaseProps) => {
	try {
		const author = options.author;
		if (author.id !== OWNER_DISCORDID) {
			context.channel?.sendMessage("Sorry mom, this command can only be used by Dad! " + emoji.cry);
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const level = Number(args.shift());
		if (!level || isNaN(level)) return;
		const maxlevel = 100, minlevel = 1;
		if (level < minlevel || level > maxlevel) return;
		await updateCollection({ id }, { character_level: level });
		const msg = `Hey Dad, I've updated the character level to __${level}__ for the card ID: __${id}__`;
		context.channel?.sendMessage(msg);
		DMUser(client, msg + " Modified by: " + author.id, OWNER_DISCORDID);
		return;
	} catch (err) {
		loggers.error("specialCommands.setCharacterLevel: ERROR", err);
		return;
	}
};

export const addRaidDamage = async ({ client, context, options, args }: BaseProps) => {
	try {
		const author = options.author;
		if (author.id !== OWNER_DISCORDID) {
			context.channel?.sendMessage("Sorry mom, this command can only be used by Dad! " + emoji.cry);
			return;
		} 
		const raidId = Number(args.shift());
		const userId = Number(args.shift());
		const damage = Number(args.shift());
		if (!raidId || !userId || !damage || isNaN(raidId) || isNaN(userId) || isNaN(damage)) return;
		const currentRaid = await getRaid({ id: raidId });
		if (!currentRaid) {
			context.channel?.sendMessage("This raid doesnt exist.");
			return;
		}
		const member = currentRaid.lobby[userId];
		if (!member) {
			context.channel?.sendMessage("This member is not in this raid");
			return;
		}
		if (damage < 0 || damage > 99999999) {
			context.channel?.sendMessage("Damage out of range");
			return;
		}
		member.total_damage = member.total_damage + damage;
		member.total_attack = member.total_attack + 2;
		member.timestamp = Date.now();
		currentRaid.lobby[member.user_id] = member;

		const stats = currentRaid.stats;
		stats.remaining_strength = stats.remaining_strength - damage;
		if (stats.remaining_strength < 100) stats.remaining_strength = 100;
		await updateRaid({ id: currentRaid.id }, {
			lobby: currentRaid.lobby,
			stats 
		});
		const msg = "Hi dad, I've updated the raid lobby for raid ID: " + currentRaid.id;
		context.channel?.sendMessage(msg);
		DMUser(client, msg + " Modified by: " + author.id, OWNER_DISCORDID);
		return;
	} catch (err) {
		loggers.error("specialCommands.addRaidDamage: ERROR", err);
		return;
	}
};

export const addWorldBossDamage = async ({ options, client, context, args }: BaseProps) => {
	try {
		const author = options.author;
		if (author.id !== OWNER_DISCORDID) {
			context.channel?.sendMessage("Sorry mom, this command can only be used by Dad! " + emoji.cry);
			return;
		}
		const dmg = Number(args.shift());
		if (!dmg || isNaN(dmg)) return;
		const raid = await getWorldBossRaid({ is_start: true });
		if (!raid) {
			context.channel?.sendMessage("World Boss does not exist or has not started.");
			return;
		}
		raid.stats.remaining_strength = raid.stats.remaining_strength - dmg;
		if (raid.stats.remaining_strength < 10000) raid.stats.remaining_strength = 10000;
		updateRaid({ id: raid.id }, { stats: raid.stats });
		const msg = "Hi dad, I've updated the world boss HP for ID: " + raid.id + 
		"\nCurrent HP: " + numericWithComma(raid.stats.remaining_strength || 0);
		context.channel?.sendMessage(msg);
		DMUser(client, msg + " Modified by: " + author.id, OWNER_DISCORDID);
	} catch (err) {
		loggers.error("specialCommands.addWorldBossDamage: ERROR", err);
		return;
	}
};

export const forceStartJourney = async (params: BaseProps) => {
	try {
		const { args, client, context } = params;
		if (params.options.author.id !== OWNER_DISCORDID) {
			context.channel?.sendMessage("You are not allowed to execute this command.");
			return;
		}
		const id = args.shift();
		if (!id) return;
		const _author = await client.users.fetch(id);
		if (!_author) {
			context.channel?.sendMessage("Invalid user id");
			return;
		}
		params.options.author = _author;
		start({
			...params,
			extras: {
				bypass: true,
				dmUser: true 
			}
		});
		context.channel?.sendMessage("Player account created");
		return;
	} catch (err) {
		loggers.error("hoaxCommands.forceStartJourney: ERROR", err);
		return;
	}
};