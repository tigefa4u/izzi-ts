import {
	DMChannel, MessageAttachment, MessageButton, MessageEmbed, NewsChannel, TextChannel, ThreadChannel 
} from "discord.js";
import implementSendMessage from "implementations/sendMessage";
import { CustomEmbedProps } from "@customTypes/embed";

type customProps = string | CustomEmbedProps;
console.log("loading module");
declare module "discord.js" {
    interface TextChannel {
        sendMessage: (content: customProps) => Promise<Message>;
    }
    interface DMChannel {
        sendMessage: (content: customProps) => Promise<Message>;
    }
    interface ThreadChannel {
        sendMessage: (content: customProps) => Promise<Message>;
    }
    interface NewsChannel {
        sendMessage: (content: customProps) => Promise<Message>;
    }
    interface MessageEmbed {
        attachments: MessageAttachment[];
        isConfirmation: boolean;
        isPagination: boolean;
        buttons: MessageButton[];
        attachFiles: (attachments: MessageAttachment[]) => MessageEmbed;
        setButtons: (buttons: MessageButton[]) => MessageEmbed;
        setConfirmation: (bool: boolean) => MessageEmbed;
        setPagination: (bool: boolean) => MessageEmbed;
    }
}

TextChannel.prototype.sendMessage = function(content: customProps) {
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
MessageEmbed.prototype.setButtons = function (buttons: MessageButton[]) {
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