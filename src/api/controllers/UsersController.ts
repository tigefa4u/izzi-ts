import { UserCreateProps, UserParams, UserProps, UserUpdateProps } from "@customTypes/users";
import Cache from "cache";
import { LEVEL_UP_EXP_MULTIPLIER } from "helpers/constants";
import loggers from "loggers";
import * as Users from "../models/Users";

async function hydrateUserCache(data: UserProps) {
	const key = "user::" + data.user_tag;
	await Cache.set(key, JSON.stringify(data));
}

async function prepareCacheHydrationData(params: Pick<UserProps, "user_tag">, data: UserUpdateProps) {
	const key = "user::" + params.user_tag;
	const cache = await Cache.get(key);
	if (!cache) return;
	const cacheData: UserProps = JSON.parse(cache);
	const dataToUpdate = Object.assign({}, { ...data });
	Object.keys(dataToUpdate).forEach((key) => {
		Object.assign(cacheData, { [key]: dataToUpdate[key as keyof UserUpdateProps] });
	});
	return cacheData;
}

export const createUser: (data: UserCreateProps) => Promise<UserProps | undefined> = async function(data) {
	try {
		const result = await Users.create(data);
		// if (result) await hydrateUserCache(result);
		return result;
	} catch (err) {
		loggers.error("api.controllers.UsersController.createUser(): something went wrong", err);
		return;
	}
};

export const getUser: (params: UserParams) => Promise<UserProps | undefined> = async function(params) {
	try {
		const result = await Users.get(params);
		return result && result[0];
	} catch (err) {
		loggers.error("api.controllers.UsersController.getUser(): something weont wrong", err);
		return;
	}
};

export const updateUser: (params: UserParams, data: UserUpdateProps) 
	=> Promise<UserProps | undefined> = async (params, data) => {
		try {
			return await Users.update(params, data);
		} catch (err) {
			loggers.error("api.controllers.UsersControler.updateUser(): something went wrong", err);
			return;
		}
	};

export const getRPGUser: (params: Pick<UserProps, "user_tag">) => Promise<UserProps | undefined> = async (params) => {
	try {
		// const key = "user::" + params.user_tag;
		// const result = await Cache.get(key);
		// if (result) {
		// 	return JSON.parse(result);
		// } else {
		const user = await getUser(params);
		if (!user) {
			loggers.info("api.controllers.UsersController.getRPGUser: User not found " + params.user_tag);
			return;
		}
		if (user.is_banned) return;
		// await hydrateUserCache(user);
		return user;
		// }
	} catch (err) {
		loggers.error("api.controllers.UsersController.getRPGUser(): something went wrong", err);
		return;
	}
};

export const updateRPGUser: (params: Pick<UserProps, "user_tag">, data: UserUpdateProps)
	=> Promise<UserProps | undefined> = async (params, data) => {
		try {
			const result = await updateUser(params, data);
			// const cacheHydrationData = await prepareCacheHydrationData(params, data);
			loggers.info("api.controllers.UsersController.updateRPGUser(): updating user " + 
				JSON.stringify(data));
			// if (cacheHydrationData) {
			// 	await hydrateUserCache(cacheHydrationData);
			// }
			return result;
		} catch (err) {
			loggers.error("api.controllers.UsersController.updateRPGUser(): someting went wrong", err);
			return;
		}
	};

export const levelUpUser = async (user: UserProps): Promise<UserProps> => {
	user.exp = user.exp - user.r_exp;
	user.level = user.level + 1;
	user.r_exp = user.level * LEVEL_UP_EXP_MULTIPLIER;
	if (user.mana < user.max_mana) {
		user.mana = user.max_mana;
	}
	user.max_mana = user.max_mana + 1;
	await updateRPGUser({ user_tag: user.user_tag }, {
		exp: user.exp,
		level: user.level,
		r_exp: user.r_exp,
		mana: user.mana,
		max_mana: user.max_mana
	});
	return user;
};

export const getTotalPlayers = async (params?: Pick<UserProps, "is_active">): Promise<number | undefined> => {
	try {
		const result = await Users.getPlayerCount(params);
		return Number(result[0].count);
	} catch (err) {
		loggers.error("api.controllers.UsersController.getTotalPlayers(): something went wrong", err);
		return;
	}
};