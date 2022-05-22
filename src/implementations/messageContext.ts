import {
	DMChannel,
	Message, MessageActionRow, MessageAttachment, MessageEmbed, TextChannel, ThreadChannel 
} from "discord.js";
import { CustomEmbedProps } from "@customTypes/embed";
import { EmbedEditOptions } from "@customTypes";

type Props = TextChannel | DMChannel | ThreadChannel;
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
	return channel.send(responseObj).catch((err) => {
		throw err;
	});
};

export const editMessage: (
    context: Message,
    content: string | CustomEmbedProps,
	options?: EmbedEditOptions
) => Promise<Message> = function (context, content, options) {
	const responseObj = getResponseObj(content, options);
	if (!context.editable) {
		throw new Error("Message not editable. Message ID: " + context.id);
	}
	return context.edit(responseObj).catch((err) => {
		throw err;
	});
};

export const deleteMessage: (context: Message) => Promise<Message<boolean>> = function (context) {
	if (!context.deletable) {
		throw new Error("Message not deletable. Message ID: " + context.id);
	}
	return context.delete();
};

export default sendMessage;
