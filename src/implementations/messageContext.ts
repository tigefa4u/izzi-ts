import {
	DMChannel,
	Message, MessageActionRow, MessageAttachment, MessageEmbed, TextChannel, ThreadChannel 
} from "discord.js";
import { CustomEmbedProps } from "@customTypes/embed";
import { EmbedEditOptions } from "@customTypes";
import loggers from "loggers";
import { delay } from "helpers";

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
		if (!content || content === "") {
			throw new Error("Unable to send content: " + JSON.stringify(content));
		}
		Object.assign(responseObj, { content });
	}
	if (content instanceof MessageEmbed) {
		if (!content.description) {
			throw new Error("Unable to send content: " + JSON.stringify(content));
		}
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
) => Promise<Message<boolean> | undefined> = async function (channel, content) {
	try {
		await delay(500);
		const responseObj = getResponseObj(content);
		return channel.send(responseObj);
	} catch (err) {
		loggers.error("implementations.messageContext.sendMessage(): something went wrong", err);
		return;
	}
};

export const editMessage: (
    context: Message,
    content: string | CustomEmbedProps,
	options?: EmbedEditOptions
) => Promise<Message> | undefined = function (context, content, options) {
	try {
		const responseObj = getResponseObj(content, options);
		if (!context.editable) {
			throw new Error("Message not editable. Message ID: " + context.id);
		}
		return context.edit(responseObj);
	} catch (err) {
		loggers.error("implementations.messageContext.editMessage(): something went wrong", err);
		return;
	}
};

export const deleteMessage: (context: Message) => Promise<Message<boolean>> | undefined = function (context) {
	try {
		if (!context.deletable) {
			throw new Error("Message not deletable. Message ID: " + context.id);
		}
		return context.delete();
	} catch (err) {
		loggers.error("implementations.messageContext.deleteMessage(): something went wrong", err);
		return;
	}
};

export default sendMessage;
