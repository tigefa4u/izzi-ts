import { DMChannel, NewsChannel, TextChannel, ThreadChannel } from "discord.js";
import { CustomEmbedProps } from "./types/embed";

type customProps = string | CustomEmbedProps;

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
    // interface MessageEmbed {
    //     attachments: MessageAttachment[];
    //     isConfirmation: boolean;
    //     isPagination: boolean;
    //     buttons: MessageButton[];
    //     attachFiles: (attachments: MessageAttachment[]) => MessageEmbed;
    //     setButtons: (buttons: MessageButton[]) => MessageEmbed;
    //     setConfirmation: (bool: boolean) => MessageEmbed;
    //     setPagination: (bool: boolean) => MessageEmbed;
    // }
}

TextChannel.prototype.sendMessage = function(content) {
    return this.send(content);
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
