import { BaseProps } from "@customTypes/command";
import loggers from "loggers";

export const dex = ({ message, client }: BaseProps) => {
	try {
		return "x";
	} catch (err) {
		loggers.error("module.commands.rpg.xendex.dex: something went wrong", err);
		return;
	}
};