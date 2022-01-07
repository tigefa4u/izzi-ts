import { BaseProps, CommandMapProps } from "@customTypes/command";
import commandMap from "modules/actions/reducer";

export const inventory = async function ({
	context,
	client,
	command,
	args = [],
	options,
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const information = async function({
	context,
	client,
	args = [],
	command,
	options
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const gamble = async function({
	context,
	client,
	args = [],
	command,
	options
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const profile = async function({
	context, client, command, options, args = [] 
}: BaseProps) {
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			command,
			options,
		});
	}
	return;
};

export const marriage = async function ({
	context, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			options
		});
	}
	return;
};

export const dungeons = async function ({
	context, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			command,
			options 
		});
	}
	return;
};

export const shop = async function ({
	context, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			command,
			options 
		});
	}
	return;
};

export const guilds = async function ({
	context, client, command, args = [], options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function") {
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			command,
			options 
		});
	}
	return;
};

export const miscellaneous = async function ({
	context, args = [], client, command, options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function")
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			args,
			client,
			options 
		});
	return;
};

export const pvp = async function ({
	context, args = [], client, command, options 
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function")
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			args,
			client,
			options 
		});
	return;
};
