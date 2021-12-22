import { UserCreateProps, UserParams, UserProps, UserUpdateProps } from "@customTypes/users";
import Cache from "cache";
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
		if (result) await hydrateUserCache(result);
		return result;
	} catch (err) {
		loggers.error("api.controllers.UsersController.createUser: something went wrong", err);
		return;
	}
};

export const getUser: (params: UserParams) => Promise<UserProps | undefined> = async function(params) {
	try {
		const result = await Users.get(params);
		return result && result[0];
	} catch (err) {
		loggers.error("api.controllers.UsersController.getUser: something weont wrong", err);
		return;
	}
};

export const updateUser: (params: UserParams, data: UserUpdateProps) 
	=> Promise<UserProps | undefined> = async (params, data) => {
		try {
			return await Users.update(params, data);
		} catch (err) {
			loggers.error("api.controllers.UsersControler.updateUser: something went wrong", err);
			return;
		}
	};

export const getRPGUser: (params: Pick<UserProps, "user_tag">) => Promise<UserProps | undefined> = async (params) => {
	try {
		const key = "user::" + params.user_tag;
		const result = await Cache.get(key);
		if (result) {
			return JSON.parse(result);
		} else {
			const user = await getUser(params);
			if (!user) {
				loggers.info("api.controllers.UsersController.getRPGUser: User not found " + params.user_tag);
				return;
			}
			await hydrateUserCache(user);
			return user;
		}
	} catch (err) {
		loggers.error("api.controllers.UsersController.getRPGUser: something went wrong", err);
		return;
	}
};

export const updateRPGUser: (params: Pick<UserProps, "user_tag">, data: UserUpdateProps)
	=> Promise<UserProps | undefined> = async (params, data) => {
		try {
			const result = await updateUser(params, data);
			const cacheHydrationData = await prepareCacheHydrationData(params, data);
			if (cacheHydrationData) {
				await hydrateUserCache(cacheHydrationData);
			}
			return result;
		} catch (err) {
			loggers.error("api.controllers.UsersController.updateRPGUser: someting went wrong", err);
			return;
		}
	};
