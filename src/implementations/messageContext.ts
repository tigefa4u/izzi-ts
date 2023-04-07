import {
	DMChannel,
	Message,
	MessageActionRow,
	MessageActionRowComponent,
	MessageAttachment,
	MessageEmbed,
	TextChannel,
	ThreadChannel,
} from "discord.js";
import { CustomEmbedProps } from "@customTypes/embed";
import { EmbedEditOptions } from "@customTypes";
import loggers from "loggers";
import { delay } from "helpers";
import { prepareConsoleButton } from "./consoleButtons";

type Props = TextChannel | DMChannel | ThreadChannel;
type ResponseObjectProps = {
  content?: string;
  embeds?: MessageEmbed[];
  files?: MessageAttachment[];
  components?: MessageActionRow[];
};

function getResponseObj(
	content: string | CustomEmbedProps,
	options?: EmbedEditOptions
) {
	const responseObj = {} as ResponseObjectProps;
	if (typeof content === "string") {
		if (!content || content === "") {
			throw new Error("Unable to send content: " + JSON.stringify(content));
		}
		// Add "." at the end to maintain consistency
		if (!content.endsWith(".")) content = content + ".";
		Object.assign(responseObj, { content });
	}
	if (content instanceof MessageEmbed) {
		if (!content.description) {
			content.description = "\n";
		}
		Object.assign(responseObj, { embeds: [ content ] });
		if (content.attachments) {
			Object.assign(responseObj, { files: [ ...content.attachments ] });
		}
		if (options?.reattachOnEdit === false) {
			delete responseObj["files"];
		}
		if (content.buttons) {
			let moreButtons = [] as MessageActionRowComponent[];
			if (content.buttons.components.length > 5) {
				moreButtons = content.buttons.components.splice(5, 10);
			}
			const componentsArr = [ content.buttons ];
			if (moreButtons.length > 0) {
				componentsArr.push({
					...content.buttons,
					components: moreButtons
				} as MessageActionRow);
			}
			Object.assign(responseObj, { components: componentsArr });
		}
	}
	return responseObj;
}

const prepareConsoleButtonWrapper = (
	channel: Props,
	content: string | CustomEmbedProps
) => {
	if (typeof content === "string" || content.hideConsoleButtons) return content;
	try {
		const hasSelectMenu = content.buttons?.components?.some(
			(component) => component.type === "SELECT_MENU"
		);
		if (hasSelectMenu)
			return content;
		const consoleButton = prepareConsoleButton(channel);
		if (consoleButton) {
			if (content.buttons) {
				content.buttons.setComponents(
					...content.buttons.components,
					...consoleButton.components
				);
			} else {
				content.setButtons(consoleButton);
			}
		}
	} catch (err) {
		loggers.error(
			"implementations.messageContext.getResponseObj: Unable to set console button",
			err
		);
	}
	return content;
};

const sendMessage: (
  channel: Props,
  content: string | CustomEmbedProps
) => Promise<Message<boolean> | undefined> = async function (channel, content) {
	try {
		await delay(100);
		content = prepareConsoleButtonWrapper(channel, content);
		const responseObj = getResponseObj(content);
		loggers.info("implementations.messageContext.sendMessage: response -> ", responseObj);
		return channel.send(responseObj);
	} catch (err) {
		loggers.error(
			"implementations.messageContext.sendMessage: ERROR",
			err
		);
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
		loggers.error(
			"implementations.messageContext.editMessage: ERROR",
			err
		);
		throw err;
	}
};

export const deleteMessage: (
  context: Message
) => Promise<Message<boolean>> | undefined = function (context) {
	try {
		if (!context.deletable) {
			throw new Error("Message not deletable. Message ID: " + context.id);
		}
		return context.delete();
	} catch (err) {
		loggers.error(
			"implementations.messageContext.deleteMessage: ERROR",
			err
		);
		throw err;
	}
};

export const editButton: (
	context: Message,
	buttons: MessageActionRow
) => Promise<Message<boolean>> | undefined = function (context, buttons) {
	try {
		let moreButtons = [] as MessageActionRowComponent[];
		if (buttons.components.length > 5) {
			moreButtons = buttons.components.splice(5, 10);
		}
		const componentsArr = [ buttons ];
		if (moreButtons.length > 0) {
			componentsArr.push({
				...buttons,
				components: moreButtons
			} as MessageActionRow);
		}
		if (!context.editable) {
			throw new Error("Message not editable. Message ID: " + context.id);
		}
		return context.edit({ components: componentsArr });
	} catch (err) {
		loggers.error(
			"implementations.messageContext.editButton: ERROR",
			err
		);
		throw err;
	}
};

export default sendMessage;
