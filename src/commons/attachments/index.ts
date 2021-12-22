import { MessageAttachment } from "discord.js";
import { JPEGStream } from "canvas";

export const createAttachment: (path: string | JPEGStream, target: string) => MessageAttachment = (path, target) => {
	return new MessageAttachment(path, target);
};