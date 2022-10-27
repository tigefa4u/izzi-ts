import { BaseProps } from "@customTypes/command";
import { updateCollection } from "api/controllers/CollectionsController";
import { getRaid, updateRaid } from "api/controllers/RaidsController";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { ranksMeta } from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";

export const setCharacterRank = async ({ client, context, options, args }: BaseProps) => {
	try {
		const author = options.author;
		if (author.id !== OWNER_DISCORDID) {
			context.channel?.sendMessage("Sorry mom, this command can only be used by Dad! " + emoji.cry);
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const rank = args.shift();
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
		currentRaid.lobby[member.user_id] = member;

		const stats = currentRaid.stats;
		stats.remaining_strength = stats.remaining_strength - damage;
		if (stats.remaining_strength < 1000) stats.remaining_strength = 10000;
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