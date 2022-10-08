import {
	DMChannel,
	Interaction,
	Message,
	MessageActionRow,
	MessageAttachment,
	MessageButton,
	MessageEmbed,
	MessageSelectMenu,
	NewsChannel,
	TextChannel,
	ThreadChannel,
} from "discord.js";
import implementSendMessage, {
	editMessage as implementEditMessage,
	deleteMessage as implementDeleteMessage,
	editButton as implementEditButton
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
    hideConsoleButtons: boolean;
    attachFiles: (attachments: MessageAttachment[]) => MessageEmbed;
    setButtons: (buttons: MessageActionRow) => MessageEmbed;
    setConfirmation: (bool: boolean) => MessageEmbed;
    setPagination: (bool: boolean) => MessageEmbed;
    setHideConsoleButtons: (bool: boolean) => void;
  }
  interface Message {
    isInteraction: boolean;
    editMessage: (
      content: CustomProps,
      options?: EmbedEditOptions
    ) => Promise<Message> | undefined;
    deleteMessage: () => Promise<Message<boolean>> | undefined;
    editButton: (button: MessageActionRow) => Promise<Message> | undefined;
  }
  interface Interaction {
    isInteraction: boolean;
  }
  interface MessageButton {
    isConsoleButton: boolean;
    setIsConsoleButton: (bool: boolean) => void;
  }
  interface MessageSelectMenu {
    isConsoleButton: boolean;
    setIsConsoleButton: (bool: boolean) => void;
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
Message.prototype.editButton = function (button: MessageActionRow) {
	return implementEditButton(this, button);
};
MessageButton.prototype.setIsConsoleButton = function (bool: boolean) {
	this.isConsoleButton = bool;
	return this;
};
MessageSelectMenu.prototype.setIsConsoleButton = function (bool: boolean) {
	throw new Error("Unimplemented");
};
Message.prototype.isInteraction = false;
Interaction.prototype.isInteraction = true;
