import { CommandProps } from "@customTypes/command";
import Cache from "cache";
import * as Commands from "../models/Commands";

async function getCommandFromCache(key: string) {
	let cachedCommands = await Cache.get("cached-commands") || "{}";
	cachedCommands = JSON.parse(cachedCommands);
	const commandId = cachedCommands[key as keyof string];
	const res = await Cache.get("command::" + commandId);
	return {
		res: res ? JSON.parse(res) : null,
		cachedCommands 
	};
}

async function setCommandCache(key: string, data: CommandProps, cachedCommands: string) {
	await Cache.set("command::" + data.id, JSON.stringify(data));
	Object.assign(cachedCommands, { [key]: data.id });
	await Cache.set("cached-commands", JSON.stringify(cachedCommands));
}

export const getAllCommands = async () => {
	try {
		return await Commands.getAll();
	} catch (err) {
		return;
	}
};

export const getCommand = async (key: string) => {
	try {
		const resp: { res: CommandProps | null, cachedCommands: string } 
            = await getCommandFromCache(key);
		let result = resp.res;
		const cachedCommands = resp.cachedCommands;
		if (!result) {
			result = await Commands.getCommand(key);
			await setCommandCache(key, result, cachedCommands);
		}
		return result;
	} catch (err) {
		return;
	}
};