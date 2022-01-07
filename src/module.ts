import {
	DMChannel, Message, MessageActionRow, MessageAttachment, MessageEmbed, NewsChannel, TextChannel, ThreadChannel
} from "discord.js";
import implementSendMessage, { editMessage as implementEditMessage } from "implementations/messageContext";
import { CustomEmbedProps } from "@customTypes/embed";

type CustomProps = string | CustomEmbedProps;
declare module "discord.js" {
    interface TextChannel {
        sendMessage: (content: CustomProps) => Promise<Message>;
    }
    interface DMChannel {
        sendMessage: (content: CustomProps) => Promise<Message>;
    }
    interface ThreadChannel {
        sendMessage: (content: CustomProps) => Promise<Message>;
    }
    interface NewsChannel {
        sendMessage: (content: CustomProps) => Promise<Message>;
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
        editMessage: (content: CustomProps) => Promise<Message>;
    }
}

TextChannel.prototype.sendMessage = function(content: CustomProps) {
	return implementSendMessage(this, content);
};
DMChannel.prototype.sendMessage = function() {
	throw new Error("Unimplemented");
};
ThreadChannel.prototype.sendMessage = function() {
	throw new Error("Unimplemented");
};
NewsChannel.prototype.sendMessage = function() {
	throw new Error("Unimplemented");
};
MessageEmbed.prototype.attachFiles = function(attachments: MessageAttachment[]) {
	this.attachments = attachments;
	return this;
};
MessageEmbed.prototype.setButtons = function (buttons: MessageActionRow) {
	this.buttons = buttons;
	return this;
};
MessageEmbed.prototype.setConfirmation = function(bool: boolean) {
	this.isConfirmation = bool;
	return this;
};
MessageEmbed.prototype.setPagination = function(bool: boolean) {
	this.isPagination = bool;
	return this;
};
Message.prototype.editMessage = function(content: CustomProps) {
	return implementEditMessage(this, content);
};