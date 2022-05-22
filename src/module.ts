import {
	DMChannel,
	Interaction,
	Message,
	MessageActionRow,
	MessageAttachment,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	ThreadChannel,
} from "discord.js";
import implementSendMessage, {
	editMessage as implementEditMessage,
	deleteMessage as implementDeleteMessage,
} from "implementations/messageContext";
import { CustomEmbedProps } from "@customTypes/embed";
import { EmbedEditOptions } from "@customTypes/index";

type CustomProps = string | CustomEmbedProps;
declare module "discord.js" {
  interface TextChannel {
    sendMessage: (content: CustomProps) => Promise<Message | undefined> | undefined;
  }
  interface DMChannel {
    sendMessage: (content: CustomProps) => Promise<Message | undefined> | undefined;
  }
  interface ThreadChannel {
    sendMessage: (content: CustomProps) => Promise<Message | undefined> | undefined;
  }
  interface NewsChannel {
    sendMessage: (content: CustomProps) => Promise<Message | undefined> | undefined;
  }
  interface MessageEmbed {
    attachments: MessageAttachment[];
    isConfirmation: boolean;
    isPagination: boolean;
    buttons: MessageActionRow;
    attachFiles: (attachments: MessageAttachment[]) => MessageEmbed;
    setButtons: (buttons: MessageActionRow) => MessageEmbed;
    setConfirmation: (bool: boolean) => MessageEmbed;
    setPagination: (bool: boolean) => MessageEmbed;
  }
  interface Message {
    editMessage: (
      content: CustomProps,
      options?: EmbedEditOptions
    ) => Promise<Message> | undefined;
    isInteraction: boolean;
    deleteMessage: () => Promise<Message<boolean>> | undefined;
  }
  interface Interaction {
    isInteraction: boolean;
  }
}

TextChannel.prototype.sendMessage = function (content: CustomProps) {
	return implementSendMessage(this, content);
};
DMChannel.prototype.sendMessage = function (content: CustomProps) {
	return implementSendMessage(this, content);
};
ThreadChannel.prototype.sendMessage = function (content: CustomProps) {
	return implementSendMessage(this, content);
};
NewsChannel.prototype.sendMessage = function () {
	throw new Error("Unimplemented");
};
MessageEmbed.prototype.attachFiles = function (
	attachments: MessageAttachment[]
) {
	this.attachments = attachments;
	return this;
};
MessageEmbed.prototype.setButtons = function (buttons: MessageActionRow) {
	this.buttons = buttons;
	return this;
};
MessageEmbed.prototype.setConfirmation = function (bool: boolean) {
	this.isConfirmation = bool;
	return this;
};
MessageEmbed.prototype.setPagination = function (bool: boolean) {
	this.isPagination = bool;
	return this;
};
Message.prototype.editMessage = function (content: CustomProps, options) {
	return implementEditMessage(this, content, options);
};
Message.prototype.deleteMessage = function () {
	return implementDeleteMessage(this);
};
Message.prototype.isInteraction = false;
Interaction.prototype.isInteraction = true;
