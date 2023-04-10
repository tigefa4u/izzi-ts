import {
	UserCreateProps,
	UserParams,
	UserProps,
	UserUpdateProps,
} from "@customTypes/users";
import Cache from "cache";
import { LEVEL_UP_EXP_MULTIPLIER, MAX_MANA_GAIN } from "helpers/constants";
import loggers from "loggers";
import { clone } from "utility";
import * as Users from "../models/Users";

async function hydrateUserCache(data: UserProps) {
	loggers.info("Hydrating user cache: ", data);
	const key = "user::" + data.user_tag;
	await Cache.set(key, JSON.stringify(data));
	if (Cache.expire) await Cache.expire(key, 60 * 60 * 24);
}

async function prepareCacheHydrationData(
	params: Pick<UserProps, "user_tag">,
	data: UserUpdateProps
) {
	const key = "user::" + params.user_tag;
	const cache = await Cache.get(key);
	if (!cache) return;
	const cacheData: UserProps = JSON.parse(cache);
	const dataToUpdate = Object.assign(cacheData, { ...data });
	Object.keys(cacheData).forEach((key) => {
		Object.assign(cacheData, { [key]: dataToUpdate[key as keyof UserUpdateProps], });
	});
	return cacheData;
}

export const createUser: (
  data: UserCreateProps
) => Promise<UserProps | undefined> = async function (data) {
	try {
		const result = await Users.create(data);
		// if (result) await hydrateUserCache(result);
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.UsersController.createUser: ERROR",
			err
		);
		return;
	}
};

export const getUser: (params: UserParams) => Promise<UserProps | undefined> =
  async function (params) {
  	try {
  		const result = await Users.get(params);
  		return result && result[0];
  	} catch (err) {
  		loggers.error(
  			"api.controllers.UsersController.getUser: something weont wrong",
  			err
  		);
  		return;
  	}
  };

export const updateUser: (
  params: UserParams,
  data: UserUpdateProps,
  options?: { hydrateCache: boolean }
) => Promise<UserProps | undefined> = async (params, data, options) => {
	try {
		if (options?.hydrateCache && params.user_tag) {
			try {
				const dataToHydrate = await prepareCacheHydrationData(
					{ user_tag: params.user_tag },
					data
				);
				if (dataToHydrate) hydrateUserCache(dataToHydrate);
			} catch (err) {
				loggers.error(
					"api.controllers.UsersController.updateUser: ERROR hydrating cache",
					err
				);
			}
		}
		return Users.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.UsersController.updateUser: ERROR",
			err
		);
		return;
	}
};

export const getRPGUser: (
  params: Pick<UserProps, "user_tag">,
  options?: {
    cached: boolean;
	ignoreBannedUser?: boolean;
  }
) => Promise<UserProps | undefined> = async (params, options) => {
	try {
		const key = "user::" + params.user_tag;
		if (options?.cached) {
			const result = await Cache.get(key);
			if (result) {
				return JSON.parse(result);
			}
		}
		const user = await getUser(params);
		if (!user) {
			loggers.info(
				"api.controllers.UsersController.getRPGUser: User not found " +
          params.user_tag
			);
			return;
		}
		if (!options?.ignoreBannedUser && user.is_banned) {
			return;
		} else if (user.is_banned) {
			Cache.del(key);
		}
		if (options?.cached) {
			Cache.set(
				key,
				JSON.stringify({
					id: user.id,
					user_tag: user.user_tag,
					username: user.username,
					voted_at: user.voted_at,
					vote_streak: user.vote_streak,
					selected_team_id: user.selected_team_id
				})
			);
			Cache.expire && Cache.expire(key, 60 * 60 * 23);
		}
		// await hydrateUserCache(user);
		return user;
		// }
	} catch (err) {
		loggers.error(
			"api.controllers.UsersController.getRPGUser: ERROR",
			err
		);
		return;
	}
};

export const updateRPGUser: (
  params: Pick<UserProps, "user_tag">,
  data: UserUpdateProps,
  options?: { hydrateCache: boolean }
) => Promise<UserProps | undefined> = async (params, data, options) => {
	try {
		const result = await updateUser(params, data, options);
		loggers.info(
			"api.controllers.UsersController.updateRPGUser: updating user ", {
				params,
				data 
			}
		);
		// if (options?.hydrateCache) {
		// 	const cacheHydrationData = await prepareCacheHydrationData(params, data);
		// 	if (cacheHydrationData) {
		// 		await hydrateUserCache(cacheHydrationData);
		// 	}
		// }
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.UsersController.updateRPGUser: someting went wrong",
			err
		);
		return;
	}
};

export const levelUpUser = async (user: UserProps): Promise<UserProps> => {
	const clonedUser = clone(user);
	clonedUser.exp = clonedUser.exp - clonedUser.r_exp;
	clonedUser.level = clonedUser.level + 1;
	clonedUser.r_exp = clonedUser.level * LEVEL_UP_EXP_MULTIPLIER;
	if (clonedUser.max_mana < MAX_MANA_GAIN) {
		clonedUser.max_mana = clonedUser.max_mana + 2;
		if (clonedUser.mana < clonedUser.max_mana) {
			clonedUser.mana = clonedUser.max_mana;
		}
	}
	await updateRPGUser(
		{ user_tag: clonedUser.user_tag },
		{
			exp: clonedUser.exp,
			level: clonedUser.level,
			r_exp: clonedUser.r_exp,
			mana: clonedUser.mana,
			max_mana: clonedUser.max_mana,
		}
	);
	return clonedUser;
};

export const getTotalPlayers = async (
	params?: Pick<UserProps, "is_active">
): Promise<{ count: string; status: string; }[] | undefined> => {
	try {
		// Need to figure out how to get both active and total count
		// in same query
		const key = "player-count";
		const result = await Cache.fetch(key, async () => {
			return await Users.getPlayerCount(params);
		});
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.UsersController.getTotalPlayers: ERROR",
			err
		);
		return;
	}
};

export const getAllUsers = async (params: { is_premium?: boolean; is_mini_premium?: boolean; } = {}) => {
	try {
		const result = await Users.get({
			is_banned: false,
			is_deleted: false,
			is_active: true,
			...params
		});
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.UsersController.getAllUsers: ERROR",
			err
		);
		return;
	}	
};