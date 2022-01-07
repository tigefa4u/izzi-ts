import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
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
		},
	};
}

export const mana = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("mana", author.id);
		context.channel.sendMessage(
			`**${author.username}** currently has __${result.data}/${result.metadata.max_mana}__ **mana**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.mana(): something went wrong",
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
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("exp", author.id);
		context.channel.sendMessage(
			`**${author.username}** currently has __${result.data}/${result.metadata.max_exp}__ **EXP**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.exp(): something went wrong",
			err
		);
		return;
	}
};

export const level = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("level", author.id);
		context.channel.sendMessage(
			`**${author.username}** is currently level __${result.data}__`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.level(): something went wrong",
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
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("raid_pass", author.id);
		context.channel.sendMessage(
			`**${author.username}** currently has` + " " +
			`__${result.data}/${result.metadata.max_permit}__ **raid permits**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.permits(): something went wrong",
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
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("shards", author.id);
		context.channel.sendMessage(
			`**${author.username}** currently has __${result.data}__ ${emoji.shard} **shards**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.shards(): something went wrong",
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
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("orbs", author.id);
		context.channel.sendMessage(
			`**${author.username}** currently has __${result.data}__ ${emoji.blueorb} **blue orbs**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.orbs(): something went wrong",
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
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("izzi_points", author.id);
		context.channel.sendMessage(
			`**${author.username}** currently has __${result.data}__ ${emoji.izzipoints} **Izzi Points**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.points(): something went wrong",
			err
		);
		return;
	}
};

export const gold = async function ({
	context,
	options,
}: Pick<BaseProps, "context" | "options">) {
	try {
		const author = options?.author;
		if (!author) return;
		const result = await getProfileInfo("gold", author.id);
		context.channel.sendMessage(
			`**${author.username}** currently has __${result.data}__ ${emoji.gold} **gold**`
		);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.profile.profileInfo.gold(): something went wrong",
			err
		);
		return;
	}
};
