import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, numericWithComma } from "helpers";
import { DUNGEON_MAX_MANA } from "helpers/constants/constants";
import loggers from "loggers";

async function getProfileInfo(key: string, id: string) {
	const user = await getRPGUser({ user_tag: id });
	return {
		data: user?.[key as keyof UserProps] || 0,
		metadata: {
			mana_refilled_at: user?.mana_refilled_at,
			premit_refilled_at: user?.raid_permit_refilled_at,
			max_mana: user?.max_mana,
			max_permit: user?.max_raid_pass,
			max_exp: user?.r_exp,
			is_premium: user?.is_premium,
			dungeon_mana: user?.dungeon_mana,
			is_mini_premium: user?.is_mini_premium
		},
	};
}

export const mana = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options.author;
		const result = await getProfileInfo("mana", author.id);
		const timestamp = new Date(new Date(result.metadata?.mana_refilled_at || "").toUTCString());
		const refilled_at = timestamp.setMinutes(timestamp.getMinutes() + 4);
		const remainingTime = (refilled_at - new Date().getTime()) / 1000 / 60;
		let remainingMinutes = Math.floor(remainingTime % 60);
		if (remainingMinutes < 0) {
			remainingMinutes = 0;
		}

		const refillTimerDesc = `[Refills __${
			(result.metadata.is_premium || result.metadata.is_mini_premium) ? 3 : 2
		} mana__ ${
			remainingMinutes ? `in ${remainingMinutes} minutes` : "every 4 minutes"
		}]`;
		const refillDGManaTimerDesc = `[Refills __5 mana__ ${
			remainingMinutes ? `in ${remainingMinutes} minutes` : "every 4 minutes"
		}]`;

		const embed = createEmbed(author)
			.setTitle(`${author.username}'s Mana Pool`)
			.setDescription(
				`**Mana:** __${result.data}/${result.metadata.max_mana}__ ` +
          refillTimerDesc +
          `\n**Dungeon Mana:** __${result.metadata.dungeon_mana}/${DUNGEON_MAX_MANA}__ ` +
          refillDGManaTimerDesc
			);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.mana: ERROR",
			err
		);
		return;
	}
};

export const exp = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options.author;
		const result = await getProfileInfo("exp", author.id);
		context.channel?.sendMessage(
			`**${author.username}** currently has __${result.data}/${result.metadata.max_exp}__ **EXP**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.exp: ERROR",
			err
		);
		return;
	}
};

const getSelectedUser = async (author: AuthorProps, args: string[], client: Client) => {
	const mentionId = getIdFromMentionedString(args.shift() || "");
	let member = author;
	if (mentionId && mentionId !== "") {
		const mentionedUser = await client.users.fetch(mentionId);
		if (mentionedUser) {
			member = mentionedUser;
		}
	}
	return member;
};

export const level = async function ({
	context,
	options,
	args,
	client
}: Pick<BaseProps, "context" | "options" | "args" | "client">) {
	try {
		const member = await getSelectedUser(options.author, args, client);
		const result = await getProfileInfo("level", member.id);
		context.channel?.sendMessage(
			`**${member.username}** is currently level __${result.data}__`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.level: ERROR",
			err
		);
		return;
	}
};

export const permits = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options.author;
		const result = await getProfileInfo("raid_pass", author.id);
		const timestamp = new Date(new Date(result.metadata?.premit_refilled_at || "").toUTCString());
		let refilled_at = timestamp.setHours(
			timestamp.getHours() + ((result.metadata.is_premium || result.metadata.is_mini_premium) ? 1 : 2)
		);
		if (result.metadata.is_premium || result.metadata.is_mini_premium) {
			refilled_at = timestamp.setMinutes(timestamp.getMinutes() + 30);
		}
		const remainingTime = (refilled_at - new Date().getTime()) / 1000 / 60;
		const remainingHours = Math.floor(remainingTime / 60);
		let remainingMinutes = Math.floor(remainingTime % 60);
		if (remainingHours < 0 && remainingMinutes < 0) {
			remainingMinutes = 0;
		}

		const refillTimerDesc =
      remainingHours > -1 || remainingMinutes > 0
      	? `[Refills in ${
      		remainingHours < 0 ? 0 : remainingHours
      	} hours ${remainingMinutes} minutes]`
      	: `[Refills every ${
      		(result.metadata.is_premium || result.metadata.is_mini_premium) ? "1 hour 30 minutes" : "2 hours"
      	}]`;

		context.channel?.sendMessage(
			`**${author.username}** currently has` +
        " " +
        `__${result.data}/${result.metadata.max_permit}__ **raid permits** ${refillTimerDesc}`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.permits: ERROR",
			err
		);
		return;
	}
};

export const shards = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options.author;
		const result = await getProfileInfo("shards", author.id);
		context.channel?.sendMessage(
			`**${author.username}** currently has __${numericWithComma(
				+result.data
			)}__ ${emoji.shard} **shards**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.shards: ERROR",
			err
		);
		return;
	}
};

export const orbs = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options.author;
		const result = await getProfileInfo("orbs", author.id);
		context.channel?.sendMessage(
			`**${author.username}** currently has __${numericWithComma(
				+result.data
			)}__ ${emoji.blueorb} **blue orbs**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.orbs: ERROR",
			err
		);
		return;
	}
};

export const points = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options.author;
		const result = await getProfileInfo("izzi_points", author.id);
		context.channel?.sendMessage(
			`**${author.username}** currently has __${numericWithComma(
				+result.data
			)}__ ${emoji.izzipoints} **Izzi Points**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.points: ERROR",
			err
		);
		return;
	}
};

export const gold = async function ({
	context,
	options,
	client,
	args
}: Pick<BaseProps, "context" | "options" | "args" | "client">) {
	try {
		const author = await getSelectedUser(options.author, args, client);
		const result = await getProfileInfo("gold", author.id);
		context.channel?.sendMessage(
			`**${author.username}** currently has __${numericWithComma(
				+result.data
			)}__ ${emoji.gold} **gold**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.gold: ERROR",
			err
		);
		return;
	}
};

export const deleteAccount = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options.author;
		await updateRPGUser({ user_tag: author.id }, { is_active: false });
		context.channel?.sendMessage(
			"We are sorry to see you leave. Your account is now inactive. " +
        "However, you can use izzi commands to activate your account again!"
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.deleteAccount: ERROR",
			err
		);
		return;
	}
};
