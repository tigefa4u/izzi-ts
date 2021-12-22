import { BaseProps, CommandMapProps } from "@customTypes/command";
import commandMap from "modules/actions/reducer";

export const inventory = async function ({
	message,
	client,
	command,
	args = [],
	options,
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const information = async function({
	message,
	client,
	args = [],
	command,
	options
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const gamble = async function({
	message,
	client,
	args = [],
	command,
	options
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const profile = async function({
	message, client, command, options, args = [] 
}: BaseProps) {
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const marriage = async function ({
	message, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			options
		});
	}
	return;
};

export const dungeons = async function ({
	message, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			command,
			options 
		});
	}
	return;
};

export const shop = async function ({
	message, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			command,
			options 
		});
	}
	return;
};

export const guilds = async function ({
	message, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			command,
			options 
		});
	}
	return;
};

export const miscellaneous = async function ({
	message, args = [], client, command, options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function")
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			args,
			client,
			options 
		});
	return;
};

export const pvp = async function ({
	message, args = [], client, command, options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function")
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			args,
			client,
			options 
		});
	return;
};
