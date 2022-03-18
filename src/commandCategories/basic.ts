import { BaseProps, CommandMapProps } from "@customTypes/command";
import commandMap from "modules/actions/reducer";

export const basics = async function ({
	context,
	client,
	args = [],
	command,
	options,
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function")
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			options
		});
	return;
};

export const emotions =  async ({
	context, command, args, client, options 
}: BaseProps) => {
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
};
export const actions = async function ({
	context, command, args, client, options 
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