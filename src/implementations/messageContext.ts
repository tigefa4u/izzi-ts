import { Message, MessageEmbed, TextChannel } from "discord.js";
import { CustomEmbedProps } from "@customTypes/embed";

type Props = TextChannel;

function getResponseObj(content: string | CustomEmbedProps) {
	const responseObj = {};
	if (typeof content === "string") {
		Object.assign(responseObj, { content });
	}
	if (content instanceof MessageEmbed) {
		Object.assign(responseObj, { embeds: [ content ] });
		if (content.attachments) {
			Object.assign(responseObj, { files: [ ...content.attachments ] });
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
    content: string | CustomEmbedProps
) => Promise<Message> = function (context, content) {
	const responseObj = getResponseObj(content);
	return context.edit(responseObj);
};

export default sendMessage;
