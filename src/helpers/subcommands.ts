import loggers from "loggers";

type C = {
    name: string;
    alias: string[];
}

export const filterSubCommands = (str: string, commandArray: C[]): C["name"] | undefined => {
	try {
		const command = commandArray.filter((x) => x.alias.includes(str) || x.name === str);
		return command[0]?.name;
	} catch (err) {
		loggers.error("helpers.subcommands.filterSubCommands(): something went wrong", err);
		return;
	}
};