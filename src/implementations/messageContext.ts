import {
	Interaction,
	Message, MessageActionRow, MessageAttachment, MessageEmbed, TextChannel 
} from "discord.js";
import { CustomEmbedProps } from "@customTypes/embed";
import { EmbedEditOptions } from "@customTypes";
import { BaseProps } from "@customTypes/command";

type Props = TextChannel;
type ResponseObjectProps = {
	content?: string;
	embeds?: MessageEmbed[];
	files?: MessageAttachment[];
	components?: MessageActionRow[];
}

function getResponseObj(content: string | CustomEmbedProps, options?: EmbedEditOptions) {
	const responseObj = {} as ResponseObjectProps;
	if (typeof content === "string") {
		Object.assign(responseObj, { content });
	}
	if (content instanceof MessageEmbed) {
		Object.assign(responseObj, { embeds: [ content ] });
		if (content.attachments) {
			Object.assign(responseObj, { files: [ ...content.attachments ] });
		}
		if (options?.reattachOnEdit === false) {
			delete responseObj["files"];
		}
		if (content.buttons) {
			Object.assign(responseObj, { components: [ content.buttons ] });
		}
	}
	return responseObj;
}

const sendMessage: (
  channel: Props,
  content: string | CustomEmbedProps
) => Promise<Message> = function (channel, content) {
	const responseObj = getResponseObj(content);
	return channel.send(responseObj);
};

export const editMessage: (
    context: Message,
    content: string | CustomEmbedProps,
	options?: EmbedEditOptions
) => Promise<Message> = function (context, content, options) {
	const responseObj = getResponseObj(content, options);
	return context.edit(responseObj);
};

export default sendMessage;
